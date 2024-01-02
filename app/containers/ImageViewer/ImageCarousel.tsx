import React from 'react';
import ImageView from "react-native-image-viewing";
import ImageHeader from "./ImageHeader";
import { StackActions, useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../lib/hooks';

function getIdByUrl(url) {
    const urlSplit = url.split('/');
    return urlSplit[urlSplit.length - 2];
}


export const ImageCarousel = ({ msgImages, source, onLoadEnd, currentId, file }) => {
    const [visible, setVisible] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const [images, setImages] = React.useState([]);
    const { dispatch } = useNavigation();
    const imagesObj = React.useRef({});
    const baseUrl = useAppSelector(state => state.share.server.server || state.server.server);

    React.useLayoutEffect(() => {
        const prepareImages = [...msgImages].reverse().map(({ user, uploadedAt, _id, url }, index) => {
            imagesObj.current[_id] = index;
            return {
                id: _id,
                uri: url,
                user: user.name,
                time: uploadedAt,
            };
        });

        setImages(prepareImages);
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
            HeaderComponent={({ imageIndex  }) => (
                <ImageHeader 
                    count={`${imageIndex + 1} of ${images.length}`}
                    title={images[imageIndex]?.user}
                    time={images[imageIndex]?.time}
                    onRequestClose={handleClose}
                />)}
        />
    );

};