import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { StyleProp, TextStyle, View, Image, Text, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';

import { IAttachment, IUserMessage } from '../../definitions';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { fetchAutoDownloadEnabled } from '../../lib/methods/autoDownloadPreference';
import {
	cancelDownload,
	downloadMediaFile,
	getMediaCache,
	isDownloadActive,
	resumeMediaFile
} from '../../lib/methods/handleMediaDownload';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import { useTheme } from '../../theme';
import Markdown from '../markdown';
import BlurComponent from './Components/BlurComponent';
import MessageContext from './Context';
import Touchable from './Touchable';
import styles from './styles';
import { isImageBase64 } from '../../lib/methods';
import { CustomIcon } from '../CustomIcon';
import I18n from 'i18n-js';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	onPress: () => void;
}

interface IMessageImage {
	file: IAttachment;
	imageUrl?: string;
	showAttachment?: (file: IAttachment, msgImages: string[]) => void;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	getCustomEmoji?: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
}

const cachedRatio = {};

const Button = React.memo(({ children, onPress, disabled }: IMessageButton) => {
	const { colors } = useTheme();
	return (
		<Touchable
			disabled={disabled}
			onPress={onPress}
			style={[styles.imageContainer, styles.mustWrapBlur]}
			background={Touchable.Ripple(colors.bannerBackground)}
		>
			{children}
		</Touchable>
	);
});

export const MessageImage = React.memo(({ imgUri, cached, loading, measureView }: { imgUri: string; cached: boolean; loading: boolean, containerWH: {} }) => {
	const { colors } = useTheme();
	const [imgWidth, setImgWidth] = useState<string | number>(200);
	const [imgHeight, setImgHeight] = useState<string | number>(200);
	const [aspectRatio, setAspectRatio] = useState<number | null>(null);
	const deviceWidthContainer = Math.trunc(Dimensions.get('window').width - 95);

	useEffect(() => {
		const handleResize = () => {
			let ratio = 1;

			if (cachedRatio[encodeURI(imgUri)]) {
				const { ratio, w, h } = cachedRatio[encodeURI(imgUri)];
				setImgWidth(w);
				setImgHeight(h);
				setAspectRatio(ratio);
				return;
			}

			Image.getSize(encodeURI(imgUri), (width, height) => {
				// console.log(`The image dimensions are W: ${width} H: ${height} Ratio: ${(width / height).toFixed(2) }`);
				ratio = width / height;

				let w = deviceWidthContainer;
				let h = deviceWidthContainer;

				 if (ratio > 1) {
					h = Math.trunc(deviceWidthContainer / ratio);
				} else {
					w = Math.trunc(deviceWidthContainer * ratio);
				}

				cachedRatio[encodeURI(imgUri)] = {ratio, w, h};

				setImgWidth(w);
				setImgHeight(h);
				setAspectRatio(ratio);
			}, (error) => {
				setAspectRatio(-1);
				console.error(`Couldn't get the image size because: ${error}`);
			});
		};
		handleResize();
	}, [imgUri]);

	if (aspectRatio === -1) {
		return (
			<View 
				style={{ 
					width: '100%', 
					height: 300, 
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#ff000012',
				}}>
				<CustomIcon name='directory-error' size={100} color={colors.bodyText} />
				<Text style={{ color: colors.bodyText }}>
					{I18n.t('Image_error_preview')}
				</Text>
			</View>
		);
	}

	return (
		<>
			<View
				style={{
					display: 'flex',
					justifyContent: 'flex-start',
					marginTop: 8
				}}
			>
				{!aspectRatio ? (
					<View 
						style={{ 
							width: cachedRatio[encodeURI(imgUri)] ? cachedRatio[encodeURI(imgUri)].w : deviceWidthContainer, 
							height: cachedRatio[encodeURI(imgUri)] ? cachedRatio[encodeURI(imgUri)].h : deviceWidthContainer, 
						}}>
						<Text style={{ color: colors.bodyText }}>
							{I18n.t('Loading')}
						</Text>
					</View>
				) : (
					<FastImage
						style={[{
							textAlign: 'left',
							aspectRatio,
							width: imgWidth,
							height: imgHeight,
						}]}
						source={{ uri: encodeURI(imgUri) }}
						resizeMode={FastImage.resizeMode.contain}
					/>
				)}
			</View>	
			{!cached ? (
				<BlurComponent 
					loading={loading} 
					style={[
						styles.image, 
						styles.imageBlurContainer,
					]} 
					iconName='arrow-down-circle' />
			) : null}
		</>
	);
});

const ImageContainer = ({
	id,
	file,
	imageUrl,
	showAttachment,
	getCustomEmoji,
	style,
	isReply,
	author,
	msg,
	msgImages,
	measureView
}: IMessageImage): React.ReactElement | null => {
	const [imageCached, setImageCached] = useState(file);
	const [cached, setCached] = useState(false);
	const [loading, setLoading] = useState(true);
	const { theme } = useTheme();
	const { baseUrl, user } = useContext(MessageContext);
	const getUrl = (link?: string) => imageUrl || formatAttachmentUrl(link, user.id, user.token, baseUrl);
	const img = getUrl(file.image_url);
	// The param file.title_link is the one that point to image with best quality, however we still need to test the imageUrl
	// And we cannot be certain whether the file.title_link actually exists.
	const imgUrlToCache = getUrl(imageCached.title_link || imageCached.image_url);

	useEffect(() => {
		const handleCache = async () => {
			if (img) {
				const isImageCached = await handleGetMediaCache();
				if (isImageCached) {
					return;
				}
				if (isDownloadActive(imgUrlToCache)) {
					handleResumeDownload();
					return;
				}
				setLoading(false);
				await handleAutoDownload();
			}
		};
		if (isImageBase64(imgUrlToCache)) {
			setLoading(false);
			setCached(true);
		} else {
			handleCache();
		}
	}, []);

	if (!img) {
		return null;
	}

	const handleAutoDownload = async () => {
		const isCurrentUserAuthor = author?._id === user.id;
		const isAutoDownloadEnabled = fetchAutoDownloadEnabled('imagesPreferenceDownload');
		if (isAutoDownloadEnabled || isCurrentUserAuthor) {
			await handleDownload();
		}
	};

	const updateImageCached = (imgUri: string) => {
		setImageCached(prev => ({
			...prev,
			title_link: imgUri
		}));
		setCached(true);
	};

	const handleGetMediaCache = async () => {
		const cachedImageResult = await getMediaCache({
			type: 'image',
			mimeType: imageCached.image_type,
			urlToCache: imgUrlToCache
		});
		if (cachedImageResult?.exists) {
			updateImageCached(cachedImageResult.uri);
			setLoading(false);
		}
		return !!cachedImageResult?.exists;
	};

	const handleResumeDownload = async () => {
		try {
			setLoading(true);
			const imageUri = await resumeMediaFile({
				downloadUrl: imgUrlToCache
			});
			updateImageCached(imageUri);
		} catch (e) {
			setCached(false);
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = async () => {
		try {
			setLoading(true);
			const imageUri = await downloadMediaFile({
				downloadUrl: imgUrlToCache,
				type: 'image',
				mimeType: imageCached.image_type
			});
			updateImageCached(imageUri);
		} catch (e) {
			setCached(false);
		} finally {
			setLoading(false);
		}
	};

	const onPress = async () => {
		if (loading && isDownloadActive(imgUrlToCache)) {
			cancelDownload(imgUrlToCache);
			setLoading(false);
			setCached(false);
			return;
		}
		if (!cached && !loading) {
			const isImageCached = await handleGetMediaCache();
			if (isImageCached && showAttachment) {
				showAttachment(file, msgImages, id); // remove cached image from carousel
				return;
			}
			if (isDownloadActive(imgUrlToCache)) {
				handleResumeDownload();
				return;
			}
			handleDownload();
			return;
		}
		if (!showAttachment) {
			return;
		}
		showAttachment(file, msgImages, id); // remove cached image from carousel
	};


	// if (msg) {
		return (
			<View>
				{msg && (
					<Markdown msg={msg} style={[isReply && style]} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
				)}
				<Button onPress={onPress}>
					<MessageImage imgUri={img} cached={cached} loading={loading} measureView={measureView} />
				</Button>
			</View>
		);
	// }

	// return (
	// 	<Button onPress={onPress}>
	// 		<MessageImage imgUri={img} cached={cached} loading={loading} />
	// 	</Button>
	// );
};

ImageContainer.displayName = 'MessageImageContainer';
MessageImage.displayName = 'MessageImage';

export default ImageContainer;
