import React, { useState } from 'react';
import { FlatListProps, StyleSheet, ImageBackground } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';

import { isIOS } from '../../../../lib/methods/helpers';
import scrollPersistTaps from '../../../../lib/methods/helpers/scrollPersistTaps';
import NavBottomFAB from './NavBottomFAB';
import { IListProps } from '../definitions';
import { SCROLL_LIMIT } from '../constants';
import { TAnyMessageModel } from '../../../../definitions';
import { useTheme } from '../../../../theme';

const AnimatedFlatList = Animated.createAnimatedComponent<FlatListProps<TAnyMessageModel>>(FlatList);

const styles = StyleSheet.create({
	image: {
	  flex: 1,
	  backgroundColor: 'black',
	},
	list: {
		flex: 1,
		padding: 0
	},
	contentContainer: {
		paddingTop: 10,
	}
  });

export const List = ({ listRef, jumpToBottom, isThread, ...props }: IListProps) => {
	const { theme, colors } = useTheme();
	const [visible, setVisible] = useState(false);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			if (event.contentOffset.y > SCROLL_LIMIT) {
				runOnJS(setVisible)(true);
			} else {
				runOnJS(setVisible)(false);
			}
		}
	});

	return (
		<>
			<ImageBackground
				source={theme === 'light' 
					? require('../../../../static/images/chat-bg-pattern-light_rocket.png')
					: require('../../../../static/images/chat-bg-pattern-rocket.png')
				}
				resizeMode="cover"
				style={{
					flex: 1,
					backgroundColor: colors.backgroundColor,
				}}
				
			>
				<AnimatedFlatList
					testID='room-view-messages'
					// @ts-ignore createAnimatedComponent is making this fail
					ref={listRef}
					keyExtractor={item => item.id}
					contentContainerStyle={styles.contentContainer}
					style={styles.list}
					inverted={isIOS}
					removeClippedSubviews={isIOS}
					// removeClippedSubviews
					initialNumToRender={7}
					onEndReachedThreshold={0.5}
					maxToRenderPerBatch={5}
					windowSize={10}
					scrollEventThrottle={16}
					onScroll={scrollHandler}
					{...props}
					{...scrollPersistTaps}
					// invertStickyHeaders
					// stickyHeaderIndices={[20, 24]}
				/>
			</ImageBackground>
			<NavBottomFAB visible={visible} onPress={jumpToBottom} isThread={isThread} />
		</>
	);
};
