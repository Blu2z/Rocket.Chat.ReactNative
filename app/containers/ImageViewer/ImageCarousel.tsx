import React, { useCallback } from 'react';
import ImageView from "react-native-image-viewing";
import { StackActions, useNavigation } from '@react-navigation/native';


import EventEmitter from '../../lib/methods/helpers/events';
import ImageHeader from "./ImageHeader";
import Toast from '../Toast';
// import { useAppSelector } from '../../lib/hooks';
import I18n from '../../i18n';

function getIdByUrl(url: string) {
	const urlSplit = url.split('/');
	return urlSplit[urlSplit.length - 2];
}

type ImageCarouselProps = {
	msgImages: ImageObj[];
	source: any;
	onLoadEnd: () => void;
	currentId: string;
	file: any;
};

type ImageObj = {
	id: string;
	uri: string;
	user: string;
	time: string;

};


export const ImageCarousel = ({ msgImages, source, onLoadEnd, currentId, file, handleSave }: ImageCarouselProps) => {
	const [visible, setVisible] = React.useState(false);
	const [activeIndex, setActiveIndex] = React.useState(-1);
	const [images, setImages] = React.useState([]);
	const [attachments, setAttachments] = React.useState([]);
	const { dispatch } = useNavigation();
	const imagesObj = React.useRef<ImageObj | {}>({});
	// const baseUrl = useAppSelector(state => state.share.server.server || state.server.server);

	React.useLayoutEffect(() => {
		const prepareAttachments = [...msgImages].reverse();
		const prepareImages = prepareAttachments.map(({ user, uploadedAt, _id, url }, index) => {
			imagesObj.current[_id] = index;
			return {
				id: _id,
				uri: url,
				user: user.name,
				time: uploadedAt
			} as ImageObj;
		});

		setImages(prepareImages);
		setAttachments(prepareAttachments);
		// const searchUri = source.uri.slice(-16) // get last 16 characters of uri (image name)

		const currentCount = imagesObj.current[getIdByUrl(file.image_url)] || 0;

		setActiveIndex(currentCount);
		setVisible(true);
		onLoadEnd();

	}, [msgImages]);

	const handleClose = () => {
		dispatch(StackActions.pop());
		setVisible(false);
	}

	const handleSaveImage = useCallback(async() => {
		EventEmitter.emit('ImageViewToast', { message: I18n.t('prepare_saved_to_gallery') });
		await handleSave(attachments[activeIndex]);
		EventEmitter.emit('ImageViewToast', { message: I18n.t('saved_to_gallery') });
	}, [activeIndex, attachments, handleSave]);

	if (!images.length) {
		return null;
	};

	return (
		<ImageView
			images={images}
			imageIndex={activeIndex}
			visible={visible}
			onRequestClose={handleClose}
			doubleTapToZoomEnabled
			HeaderComponent={({ imageIndex }) => (
				<>
					<Toast listenerEvent='ImageViewToast' />
					<ImageHeader
						count={`${imageIndex + 1} of ${images.length}`}
						title={images[imageIndex]?.user}
						time={images[imageIndex]?.time}
						onRequestClose={handleClose}
						handleSave={handleSaveImage}
					/>
				</>
			)}
		/>
	);

};