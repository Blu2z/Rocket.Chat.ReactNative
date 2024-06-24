// import React, { useContext } from 'react';
// import { View } from 'react-native';
// import Touchable from 'react-native-platform-touchable';

// import MessageContext from './Context';
// import User from './User';
// import styles from './styles';
// import RepliedThread from './RepliedThread';
// import MessageAvatar from './MessageAvatar';
// import Attachments from './Attachments';
// import Urls from './Urls';
// import Thread from './Thread';
// import Blocks from './Blocks';
// import Reactions from './Reactions';
// import Broadcast from './Broadcast';
// import Discussion from './Discussion';
// import Content from './Content';
// import CallButton from './CallButton';
// import { themes } from '../../lib/constants';
// import { IMessage, IMessageInner, IMessageTouchable } from './interfaces';
// import { useTheme } from '../../theme';
// import RightIcons from './Components/RightIcons';

// const MessageInner = React.memo((props: IMessageInner) => {
// 	if (props.isPreview) {
// 		return (
// 			<>
// 				<User {...props} />
// 				<>
// 					<Content {...props} />
// 					<Attachments {...props} />
// 				</>
// 				<Urls {...props} />
// 			</>
// 		);
// 	}

// 	if (props.type === 'discussion-created') {
// 		return (
// 			<>
// 				<User {...props} />
// 				<Discussion {...props} />
// 			</>
// 		);
// 	}

// 	if (props.type === 'jitsi_call_started') {
// 		return (
// 			<>
// 				<User {...props} />
// 				<Content {...props} isInfo />
// 				<CallButton {...props} />
// 			</>
// 		);
// 	}

// 	if (props.blocks && props.blocks.length) {
// 		return (
// 			<>
// 				<User {...props} />
// 				<Blocks {...props} />
// 				<Thread {...props} />
// 				<Reactions {...props} />
// 			</>
// 		);
// 	}

// 	return (
// 		<>
// 			<User {...props} />
// 			<>
// 				<Content {...props} />
// 				<Attachments {...props} />
// 			</>
// 			<Urls {...props} />
// 			<Thread {...props} />
// 			<Reactions {...props} />
// 			<Broadcast {...props} />
// 		</>
// 	);
// });
// MessageInner.displayName = 'MessageInner';

// const Message = React.memo((props: IMessage) => {
// 	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
// 		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
// 		return (
// 			<View style={[styles.container, props.style]}>
// 				{thread}
// 				<View style={styles.flex}>
// 					<MessageAvatar small {...props} />
// 					<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
// 						<Content {...props} />
// 						{props.isInfo && props.type === 'message_pinned' ? (
// 							<View pointerEvents='none'>
// 								<Attachments {...props} />
// 							</View>
// 						) : null}
// 					</View>
// 				</View>
// 			</View>
// 		);
// 	}

// 	return (
// 		<View style={[styles.container, props.style]}>
// 			<View style={styles.flex}>
// 				<MessageAvatar {...props} />
// 				<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
// 					<MessageInner {...props} />
// 				</View>
// 				{!props.isHeader ? (
// 					<RightIcons
// 						type={props.type}
// 						msg={props.msg}
// 						isEdited={props.isEdited}
// 						hasError={props.hasError}
// 						isReadReceiptEnabled={props.isReadReceiptEnabled}
// 						unread={props.unread}
// 						isTranslated={props.isTranslated}
// 					/>
// 				) : null}
// 			</View>
// 		</View>
// 	);
// });
// Message.displayName = 'Message';

// const MessageTouchable = React.memo((props: IMessageTouchable & IMessage) => {
// 	const { onPress, onLongPress } = useContext(MessageContext);
// 	const { theme } = useTheme();

// 	let backgroundColor = undefined;
// 	if (props.isBeingEdited) {
// 		backgroundColor = themes[theme].statusBackgroundWarning2;
// 	}
// 	if (props.highlighted) {
// 		backgroundColor = themes[theme].headerBackground;
// 	}

// 	if (props.hasError) {
// 		return (
// 			<View>
// 				<Message {...props} />
// 			</View>
// 		);
// 	}

// 	return (
// 		<Touchable
// 			onLongPress={onLongPress}
// 			onPress={onPress}
// 			disabled={(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp || props.type === 'jitsi_call_started'}
// 			style={{ backgroundColor }}
// 		>
// 			<View>
// 				<Message {...props} />
// 			</View>
// 		</Touchable>
// 	);
// });

// MessageTouchable.displayName = 'MessageTouchable';

// export default MessageTouchable;

import React, { useContext } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import MessageContext from './Context';
import User from './User';
import styles from './styles';
import RepliedThread from './RepliedThread';
import MessageAvatar from './MessageAvatar';
import Attachments from './Attachments';
import Urls from './Urls';
import Thread from './Thread';
import Blocks from './Blocks';
import Reactions from './Reactions';
import Broadcast from './Broadcast';
import Discussion from './Discussion';
import Content from './Content';
import CallButton from './CallButton';
import Reply from './Reply';
import { themes } from '../../lib/constants';
import { IMessage, IMessageInner, IMessageTouchable } from './interfaces';
import { TSupportedThemes, useTheme } from '../../theme';
import RightIcons from './Components/RightIcons';
import { getSingleMessage } from '../../lib/services/restApi';
import { store as reduxStore } from '../../lib/store/auxStore';
import { set } from 'lodash';
import { ResultFor } from 'definitions/rest/helpers';

import Animated, {
	useAnimatedGestureHandler,
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	runOnJS
} from 'react-native-reanimated';
import {
	LongPressGestureHandler,
	PanGestureHandler,
	State,
	HandlerStateChangeEventPayload,
	PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';

const getLinkByForwardMessage = (msg: string | undefined): string | null => {
	if (!msg) {
		return null;
	}
	// const regex = /\[Forward_message\]\((.*)\)/g;
	const regex = /\[(:?Forward_message|\s+)\]\((.*?)\)/g;
	const link = regex.exec(msg);
	return link ? link[2] : null;
};

const isReplyMessage = (msg: string | undefined) => {
	if (!msg) {
		return false;
	}

	const { server } = reduxStore.getState();
	const re = new RegExp(`\\[.?]\\(${server.server}`);

	return re.test(msg);
};

const isReplyForwardMessage = (msg: string | undefined) => {
	if (!msg) {
		return false;
	}

	return msg.includes('[Reply_message][Forward_message]');
}

const isForwardMessage = (msg: string | undefined) => {
	if (!msg) {
		return false;
	}

	return msg.includes('[Forward_message]');
}

const getIdMessageByLink = (msg: string | undefined): string | null => {
	if (!msg) {
		return null;
	}
	const regex = /\?msg=(.*)\)/g;
	const id = regex.exec(msg);
	return id ? id[1] : null;
}

const TestReply = (props) =>{
	const { theme } = useTheme();
	const [loading, setLoading] = React.useState(false);
	const { onLinkPress } = useContext(MessageContext);

	const [data, setData] = React.useState<ResultFor<"GET", "chat.getMessage"> | null>(null);

	React.useEffect(() => {
		const getMessage = async () => {
			setLoading(true);
			const id = getIdMessageByLink(props.msg);
			if (id) {
				const result = await getSingleMessage(id);
				setData(result);
			}
			setLoading(false);
		};

		getMessage();
	}, []);


	if (!data) {
		return <Text style={{ color: themes[theme].titleText }}>Loading...</Text>
	}

	const isMultiplyReply = isReplyMessage(data.message.msg) || isForwardMessage(data.message.msg);
	const isForward = isForwardMessage(data.message.msg);

	if (isForward) {
		return (
			<>
				{!props.secondMessage && <User {...props} />}
				{/* <View 
					style={{ 
						borderRightWidth: 1, 
						borderRightColor: themes[theme].bannerBackground,
						borderTopWidth: 1,
						borderTopColor: themes[theme].bannerBackground,
						borderBottomWidth: 1, 
						borderBottomColor: themes[theme].bannerBackground,
						borderLeftWidth: 2, 
						borderLeftColor: themes[theme].tintColor,
						paddingRight: 8,
						paddingLeft: 8,
						paddingBottom: 4,
						borderRadius: 8,
						borderBottomLeftRadius: 0,
						borderTopLeftRadius: 0,
					}}
				>
					<Text style={{ color: themes[theme].titleText }}>
						{data.message.u.name}
					</Text> */}
					<TestReply 
						{...props}
						countMessage={props.countMessage ? props.countMessage + 1 : 2}
						secondMessage
						msg={data.message.msg} 
						md={data.message.md}
						attachments={data.message.attachments}
						localReply={false}
					/>
				{/* </View> */}
				<Content {...props} />
				<Attachments {...props} noReplyComponent />
				
			</>
		);
	}

	return (
		<>
			{!props.secondMessage && <User {...props} />}
			{/* <User {...props} /> */}
			<Reply 
				{...props}
				attachment={{
					...props.attachment,
					noReplyComponent: isMultiplyReply,
					attachments: data.message.attachments,
					author_name: props.localReply ? data.message.u.name : `от ${data.message.u.name}`,
					message_link: data.message._id,
					ts: data.message.ts,
					extraTitle: !props.localReply && 'пересланное сообщение',
					forwardLink: getLinkByForwardMessage(props.msg),
					onLinkPress: props.localReply ? null : onLinkPress,
					title: data.message.msg,
				}}
			/>

			{props.localReply && !props.secondMessage && <Content {...props} />}
			
			<Urls {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
			<Thread {...props} />
		</>
	);
};


const MessageInner = React.memo((props: IMessageInner) => {
	if (isReplyMessage(props.msg)|| isReplyForwardMessage(props.msg)) {
		return <TestReply {...props} localReply />
	}

	if (isForwardMessage(props.msg)) {
		return <TestReply {...props} />
	}

	if (props.isPreview) {
		return (
			<>
				<User {...props} />
				<>
					<Attachments {...props} />
					<Content {...props} />
				</>
				<Urls {...props} />
			</>
		);
	}

	if (props.type === 'discussion-created') {
		return (
			<>
				<User {...props} />
				<Discussion {...props} />
			</>
		);
	}

	if (props.type === 'jitsi_call_started') {
		return (
			<>
				<User {...props} />
				<Content {...props} isInfo />
				<CallButton {...props} />
			</>
		);
	}

	if (props.blocks && props.blocks.length) {
		return (
			<>
				<User {...props} />
				<Blocks {...props} />
				<Thread {...props} />
				<Reactions {...props} />
			</>
		);
	}

	return (
		<>
			<User {...props} />
			<>
				<Attachments {...props} />
				<Content {...props} />
			</>
			<Urls {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
			<Thread {...props} />
		</>
	);
});
MessageInner.displayName = 'MessageInner';

const Message = React.memo((props: IMessage) => {
	const { colors, theme } = useTheme();
	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		return (
			<View style={[styles.container, props.style]}>
				{thread}
				<View style={styles.flex}>
					<MessageAvatar small {...props} />
					<View 
						style={[
							styles.messageContent, 
							props.isHeader && styles.messageContentWithHeader,
							{ backgroundColor: themes[theme].chatComponentBackground }
						]}>
						<Content {...props} />
						{props.isInfo && props.type === 'message_pinned' ? (
							<View pointerEvents='none'>
								<Attachments {...props} />
							</View>
						) : null}
					</View>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, props.style]}>
			<View style={{
				// flex: 1,
				position: 'relative',
				flexDirection: 'row',
				alignItems: 'flex-start',
				justifyContent: 'flex-start',
			}}>
				<MessageAvatar {...props} />
				<View 
					style={[
						styles.messageContent,
						props.isHeader && styles.messageContentWithHeader,
						{
							backgroundColor: themes[theme].backgroundColor,
							maxWidth: props?.measureView?.width ? props.measureView.width - 64 : 300,
							overflow: 'hidden',
						}
					]}>
					<MessageInner {...props} />
				</View>
				{!props.isHeader ? (
					<RightIcons
						type={props.type}
						msg={props.msg}
						isEdited={props.isEdited}
						hasError={props.hasError}
						isReadReceiptEnabled={props.isReadReceiptEnabled}
						unread={props.unread}
						pinned={props.pinned}
					/>
				) : null}
			</View>
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props: IMessageTouchable & IMessage) => {
	const { onPress, onLongPress } = useContext(MessageContext);
	const { theme } = useTheme();

	if (props.hasError) {
		return (
			<View>
				<Message {...props} />
			</View>
		);
	}

	return (
		<Touchable
			onLongPress={onLongPress}
			onPress={onPress}
			disabled={(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp || props.type === 'jitsi_call_started'}
			style={{ backgroundColor: props.highlighted ? themes[theme].headerBackground : undefined }}
		>
			<View>
				<Message {...props} />
			</View>
		</Touchable>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

// export default MessageTouchable;

const MessageTouchable2 = React.memo((props: IMessageTouchable & IMessage) => {
	const { onPress, onLongPress } = useContext(MessageContext);
	const { theme, colors } = useTheme();
	const rowOffSet = useSharedValue(0);
	const transX = useSharedValue(0);
	const rowState = useSharedValue(0); // 0: closed, 1: right opened, -1: left opened
	let _value = 0;

	const onLongPressHandlerStateChange = ({ nativeEvent }: { nativeEvent: HandlerStateChangeEventPayload }) => {
		if (nativeEvent.state === State.ACTIVE) {
			// handleLongPress();
			onLongPress();
		}
	};

	const handleRelease = (event: PanGestureHandlerEventPayload) => {
		// console.log('===> handleRelease');
		const { translationX } = event;
		_value += translationX;
		let toValue = 0;
		// if (rowState.value === 0) {
		// 	// if no option is opened
		// 	if (translationX > 0 && translationX < LONG_SWIPE) {
		// 		if (I18n.isRTL) {
		// 			toValue = 2 * ACTION_WIDTH;
		// 		} else {
		// 			toValue = ACTION_WIDTH;
		// 		}
		// 		rowState.value = -1;
		// 	} else if (translationX >= LONG_SWIPE) {
		// 		toValue = 0;
		// 		if (I18n.isRTL) {
		// 			handleHideChannel();
		// 		} else {
		// 			handleToggleRead();
		// 		}
		// 	} else if (translationX < 0 && translationX > -LONG_SWIPE) {
		// 		// open trailing option if he swipe left
		// 		if (I18n.isRTL) {
		// 			toValue = -ACTION_WIDTH;
		// 		} else {
		// 			toValue = -2 * ACTION_WIDTH;
		// 		}
		// 		rowState.value = 1;
		// 	} else if (translationX <= -LONG_SWIPE) {
		// 		toValue = 0;
		// 		rowState.value = 1;
		// 		if (I18n.isRTL) {
		// 			handleToggleRead();
		// 		} else {
		// 			handleHideChannel();
		// 		}
		// 	} else {
		// 		toValue = 0;
		// 	}
		// } else if (rowState.value === -1) {
		// 	// if left option is opened
		// 	if (_value < SMALL_SWIPE) {
		// 		toValue = 0;
		// 		rowState.value = 0;
		// 	} else if (_value > LONG_SWIPE) {
		// 		toValue = 0;
		// 		rowState.value = 0;
		// 		if (I18n.isRTL) {
		// 			handleHideChannel();
		// 		} else {
		// 			handleToggleRead();
		// 		}
		// 	} else if (I18n.isRTL) {
		// 		toValue = 2 * ACTION_WIDTH;
		// 	} else {
		// 		toValue = ACTION_WIDTH;
		// 	}
		// } else if (rowState.value === 1) {
		// 	// if right option is opened
		// 	if (_value > -2 * SMALL_SWIPE) {
		// 		toValue = 0;
		// 		rowState.value = 0;
		// 	} else if (_value < -LONG_SWIPE) {
		// 		if (I18n.isRTL) {
		// 			handleToggleRead();
		// 		} else {
		// 			handleHideChannel();
		// 		}
		// 	} else if (I18n.isRTL) {
		// 		toValue = -ACTION_WIDTH;
		// 	} else {
		// 		toValue = -2 * ACTION_WIDTH;
		// 	}
		// }

		transX.value = withSpring(0 /* toValue */, { overshootClamping: true });
		rowOffSet.value = toValue;
		_value = toValue;
	};

	const onGestureEvent = useAnimatedGestureHandler({
		onActive: event => {
			transX.value = event.translationX + rowOffSet.value;
			// if (transX.value > 2 * width) transX.value = 2 * width;
		},
		onEnd: event => {
			runOnJS(handleRelease)(event);
		}
	});

	const animatedStyles = useAnimatedStyle(() => ({ transform: [{ translateX: transX.value }] }));

	if (props.hasError) {
		return (
			<View>
				<Message {...props} />
			</View>
		);
	}

	return (
		<LongPressGestureHandler onHandlerStateChange={onLongPressHandlerStateChange}>
			<Animated.View>
				<PanGestureHandler activeOffsetX={[-20, 20]} onGestureEvent={onGestureEvent} enabled>
					<Animated.View>
						{/* <LeftActions
							transX={transX}
							isRead={isRead}
							width={width}
							onToggleReadPress={onToggleReadPress}
							displayMode={displayMode}
						/>
						<RightActions
							transX={transX}
							favorite={favorite}
							width={width}
							toggleFav={handleToggleFav}
							onHidePress={onHidePress}
							displayMode={displayMode}
						/> */}
						<Animated.View style={animatedStyles}>
							<Touchable
								onLongPress={onLongPress}
								onPress={onPress}
								disabled={(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp || props.type === 'jitsi_call_started'}
								style={{ backgroundColor: props.highlighted ? themes[theme].headerBackground : undefined }}
							>
								<View>
									<Message {...props} />
								</View>
							</Touchable>
						</Animated.View>
					</Animated.View>
				</PanGestureHandler>
			</Animated.View>
		</LongPressGestureHandler>
	);
});

MessageTouchable2.displayName = 'MessageTouchable';

export default MessageTouchable;
// export default MessageTouchable2;
