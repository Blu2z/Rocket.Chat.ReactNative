import React from 'react';
import { StyleSheet, SafeAreaView, View, Text } from 'react-native';
import ImageView from 'react-native-image-viewing';
import ImageHeader from './ImageHeader';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../lib/hooks';

export const ImageCarousel = ({ msgImages, source, onLoadEnd }) => {
	const [visible, setVisible] = React.useState(false);
	const [activeIndex, setActiveIndex] = React.useState(-1);
	const [images, setImages] = React.useState([]);
	const { dispatch } = useNavigation();
	const baseUrl = useAppSelector(state => state.share.server.server || state.server.server);

	React.useLayoutEffect(() => {
		const prepareImages = [...msgImages].reverse().map(({ attachments, u, ts }) => {
			return {
				uri: `${baseUrl}${encodeURI(attachments[0].image_url)}`,
				user: u.name,
				time: ts
			};
		});

		setImages(prepareImages);
		setActiveIndex(prepareImages.findIndex(({ uri }) => source.uri.search(uri) > -1));
		setVisible(true);
		onLoadEnd();
	}, [msgImages]);

	const handleClose = () => {
		dispatch(StackActions.pop());
		setVisible(false);
	};

	if (!images.length) {
		return null;
	}

	return (
		<ImageView
			images={images}
			imageIndex={activeIndex}
			visible={visible}
			onRequestClose={handleClose}
			doubleTapToZoomEnabled
			HeaderComponent={({ imageIndex }) => (
				<ImageHeader
					count={`${imageIndex + 1} of ${images.length}`}
					title={images[imageIndex]?.user}
					time={images[imageIndex]?.time}
					onRequestClose={handleClose}
				/>
			)}
		/>
	);
};
