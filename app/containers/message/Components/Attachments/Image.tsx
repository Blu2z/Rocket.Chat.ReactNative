import React, { useCallback, useContext, useEffect, useState } from 'react';
import FastImage from 'react-native-fast-image';

import { StyleProp, TextStyle, View, Text, Image, Dimensions } from 'react-native';
import I18n from 'i18n-js';

import { emitter } from '../../../../lib/methods/helpers';
import { IAttachment, IUserMessage } from '../../../../definitions';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import { fetchAutoDownloadEnabled } from '../../../../lib/methods/autoDownloadPreference';
import { cancelDownload, downloadMediaFile, getMediaCache, isDownloadActive } from '../../../../lib/methods/handleMediaDownload';
import { formatAttachmentUrl } from '../../../../lib/methods/helpers/formatAttachmentUrl';
import { useTheme } from '../../../../theme';
import Markdown from '../../../markdown';
import BlurComponent from '../OverlayComponent';
import MessageContext from '../../Context';
import Touchable from '../../Touchable';
import styles from '../../styles';
import { isImageBase64 } from '../../../../lib/methods';
import { isValidUrl } from '../../../../lib/methods/helpers/isValidUrl';
import { useFile } from '../../hooks/useFile';
import { CustomIcon } from '../../../CustomIcon';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	onPress: () => void;
}

interface IMessageImage {
	file: IAttachment;
	imageUrl?: string;
	showAttachment?: (file: IAttachment, msgImages: string[], id: number) => void;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	getCustomEmoji?: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
	msgImages?: string[];
}

const Button = React.memo(({ children, onPress, disabled }: IMessageButton) => {
	const { colors } = useTheme();
	return (
		<Touchable
			disabled={disabled}
			onPress={onPress}
			style={styles.imageContainer}
			background={Touchable.Ripple(colors.surfaceNeutral)}>
			{children}
		</Touchable>
	);
});

export const MessageImage = React.memo(
	({ imgUri, cached, loading, encrypted = false }: { imgUri: string; cached: boolean; loading: boolean; encrypted: boolean }) => {
		const { colors } = useTheme();
		const [imgWidth, setImgWidth] = useState<string | number>(200);
		const [imgHeight, setImgHeight] = useState<string | number>(200);
		const [aspectRatio, setAspectRatio] = useState<number | null>(null);
		const valid = isValidUrl(imgUri);

		useEffect(() => {
			const handleResize = () => {
				let ratio = 1;
				Image.getSize(encodeURI(imgUri), (width, height) => {
					// console.log(`The image dimensions are W: ${width} H: ${height} Ratio: ${(width / height).toFixed(2) }`);
					ratio = width / height;
					const deviceWidth = Math.trunc(Dimensions.get('window').width - 100);
					if (ratio === 1) {
						setImgWidth(deviceWidth);
						setImgHeight(deviceWidth);
					} else if (ratio > 1) {
						setImgWidth(deviceWidth);
						setImgHeight(Math.trunc(deviceWidth / ratio));
					} else {
						setImgWidth(Math.trunc(deviceWidth * ratio));
						setImgHeight(deviceWidth);
					}
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

		if (encrypted && !loading && cached) {
			return (
				<>
					<View style={styles.image} />
					<BlurComponent loading={false} style={[styles.image, styles.imageBlurContainer]} iconName='encrypted' />
				</>
			);
		}

		return (
			<>
				{valid && !aspectRatio ? (
					<View style={{ width: 400, height: 400 }}>
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
				)
				}

				{!cached ? (
					<BlurComponent loading={loading} style={[styles.image, styles.imageBlurContainer]} iconName='arrow-down-circle' />
				) : null}
			</>
		);
	}
);

const ImageContainer = ({
	file,
	imageUrl,
	showAttachment,
	getCustomEmoji,
	style,
	isReply,
	author,
	msg,
	msgImages
}: IMessageImage): React.ReactElement | null => {
	const { id, baseUrl, user } = useContext(MessageContext);
	const [imageCached, setImageCached] = useFile(file, id);
	const [cached, setCached] = useState(false);
	const [loading, setLoading] = useState(true);
	const { theme } = useTheme();
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
				await handleAutoDownload();
				setLoading(false);
			}
		};
		if (isImageBase64(imgUrlToCache)) {
			setLoading(false);
			setCached(true);
		} else {
			handleCache();
		}

		return () => {
			emitter.off(`downloadMedia${id}`, downloadMediaListener);
		};
	}, []);

	const downloadMediaListener = useCallback((imageUri: string) => {
		updateImageCached(imageUri);
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
		setImageCached({
			title_link: imgUri
		});
		setCached(true);
	};

	const setDecrypted = () => {
		if (imageCached.e2e === 'pending') {
			setImageCached({
				e2e: 'done'
			});
		}
	};

	const handleGetMediaCache = async () => {
		const cachedImageResult = await getMediaCache({
			type: 'image',
			mimeType: imageCached.image_type,
			urlToCache: imgUrlToCache
		});
		const result = !!cachedImageResult?.exists && imageCached.e2e !== 'pending';
		if (result) {
			updateImageCached(cachedImageResult.uri);
		}
		return result;
	};

	const handleResumeDownload = () => {
		emitter.on(`downloadMedia${id}`, downloadMediaListener);
	};

	const handleDownload = async () => {
		try {
			const imageUri = await downloadMediaFile({
				messageId: id,
				downloadUrl: imgUrlToCache,
				type: 'image',
				mimeType: imageCached.image_type,
				encryption: file.encryption,
				originalChecksum: file.hashes?.sha256
			});
			setDecrypted();
			updateImageCached(imageUri);
		} catch (e) {
			setCached(false);
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
				// showAttachment(imageCached, msgImages);
				showAttachment(file, msgImages, id); // remove cached image from carousel
				return;
			}
			if (isDownloadActive(imgUrlToCache)) {
				handleResumeDownload();
				return;
			}
			setLoading(true);
			handleDownload();
			return;
		}
		if (!showAttachment || !imageCached.title_link) {
			return;
		}
		// showAttachment(imageCached, msgImages);
		showAttachment(file, msgImages, id); // remove cached image from carousel
	};

	const image = (
		<Button onPress={onPress}>
			<MessageImage
				imgUri={file.encryption && imageCached.title_link ? imageCached.title_link : img}
				cached={cached}
				loading={loading}
				encrypted={imageCached.e2e === 'pending'}
			/>
		</Button>
	);

	if (msg) {
		return (
			<View>
				<Markdown msg={msg} style={[isReply && style]} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
				{image}
			</View>
		);
	}

	return image;
};

ImageContainer.displayName = 'MessageImageContainer';
MessageImage.displayName = 'MessageImage';

export default ImageContainer;
