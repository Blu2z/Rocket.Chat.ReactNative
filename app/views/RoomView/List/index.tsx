import React, { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import moment from 'moment';

import ActivityIndicator from '../../../containers/ActivityIndicator';
import { isAndroid, useDebounce } from '../../../lib/methods/helpers';
import { EmptyRoom, List } from './components';
import { IListContainerProps, IListContainerRef, IListProps } from './definitions';
import { useMessages, useScroll } from './hooks';
import { Services } from '../../../lib/services';

const styles = StyleSheet.create({
	inverted: {
		...Platform.select({
			android: {
				scaleY: -1
			}
		})
	}
});

const Container = ({ children }: { children: React.ReactElement }) =>
	isAndroid ? <View style={{ flex: 1, scaleY: -1 }}>{children}</View> : <>{children}</>;

const ListContainer = forwardRef<IListContainerRef, IListContainerProps>(
	({ rid, tmid, renderRow, showMessageInMainThread, serverVersion, hideSystemMessages, listRef, loading, msgImages }, ref) => {
		const [messages, messagesIds, fetchMessages] = useMessages({
			rid,
			tmid,
			showMessageInMainThread,
			serverVersion,
			hideSystemMessages
		});
		const {
			jumpToBottom,
			jumpToMessage,
			cancelJumpToMessage,
			viewabilityConfigCallbackPairs,
			handleScrollToIndexFailed,
			highlightedMessageId
		} = useScroll({ listRef, messagesIds });
		// const [msgImages, setMsgImages] = React.useState<null | any[]>(null);

		const onEndReached = useDebounce(() => {
			listRef.current?.scrollToIndex({ index: messages.length -1, animated: false });
			fetchMessages();
		}, 300);

		// useEffect(() => {
		// 	const getMsgImages = async () => {
		// 		const result = await Services.getFiles(rid, 'c', 0);
		// 		const images = result.files.filter((item: any) => item.typeGroup === 'image');
		// 		setMsgImages(images);
		// 	};
		// 	if(messages.length > 0 && !msgImages) {
		// 		getMsgImages();
		// 	}
		// }, [messages]);

		useImperativeHandle(ref, () => ({
			jumpToMessage,
			cancelJumpToMessage
		}));

		const renderFooter = () => {
			if (loading && rid) {
				return <ActivityIndicator />;
			}
			return null;
		};

		// const msgImages2 = messages.filter((item: any) => item?.attachments?.length && item.attachments[0].image_url);
		const renderItem: IListProps['renderItem'] = ({ item, index }) => (
			<View style={styles.inverted}>
				{renderRow(item, messages[index + 1], highlightedMessageId)}
			</View>
		);

		
		// const date = new Date();

		// const testMessages = messages.reduce((acc: any, item: any, index) => {
		// 	let dateSeparator = null;
		// 	let showUnreadSeparator = false;

		// 	acc.data.push(item);

		// 	if (index === messages.length - 1) {
		// 		dateSeparator = item.ts;
		// 		showUnreadSeparator = moment(item.ts).isAfter(date);

		// 		acc.data.push({ dateSeparator, showUnreadSeparator, isSeperator: true });
		// 		acc.separators.push(messages.length - index - 1);

		// 		return acc;
		// 	}

		// 	if (index !== 0) {
		// 	// 	dateSeparator = item.ts;
		// 	// 	showUnreadSeparator = moment(item.ts).isAfter(date);
		// 	// } else {
		// 		showUnreadSeparator =
		// 			(date && moment(item.ts).isSameOrAfter(date) && moment(messages[index -1].ts).isBefore(date)) ?? false;
		// 		if (!moment(item.ts).isSame(messages[index -1].ts, 'day')) {
		// 			dateSeparator = item.ts;
		// 		}
		// 	}

		// 	if (showUnreadSeparator || dateSeparator) {
		// 		acc.data.push({ dateSeparator, showUnreadSeparator, isSeperator: true });
		// 		acc.separators.push(messages.length - index - 1);
		// 	}
			

		// 	return acc;
		// }, {data: [], separators: []});

		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} />
				<Container>
					<List
						listRef={listRef}
						data={messages}
						renderItem={renderItem}
						onEndReached={onEndReached}
						ListFooterComponent={renderFooter}
						onScrollToIndexFailed={handleScrollToIndexFailed}
						viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
						jumpToBottom={jumpToBottom}
						isThread={!!tmid}
						// stickyHeaderIndices={testMessages.data.reduce((acc: any, item: any, index) => {
						// 	if (item.isSeperator) {
						// 		acc.push(index);
						// 	}
						// 	return acc;
						// }, [])}
					/>
				</Container>
			</>
		);
	}
);

export default ListContainer;
