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

const isReplyMessage = (msg: string | undefined) => {
	if (!msg) {
		return false;
	}

	const { server } = reduxStore.getState();
	const re = new RegExp(`\\[.?]\\(${server.server}`);

	return re.test(msg);
};

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

	if (isMultiplyReply) {
		return (
			<>
				{!props.secondMessage && <User {...props} />}
				<View 
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
					</Text>
					<TestReply 
						{...props}
						countMessage={props.countMessage ? props.countMessage + 1 : 2}
						secondMessage
						msg={data.message.msg} 
						md={data.message.md}
						attachments={data.message.attachments}
					/>
				</View>
				<Content {...props} />
				<Attachments {...props} noReplyComponent />
				
			</>
		);
	}

	return (
		<>
			{!props.secondMessage && <User {...props} />}
			<Reply 
				{...props}
				attachment={{
					...props.attachment,
					attachments: data.message.attachments,
					author_name: !props.localReply ? data.message.u.name : `от ${data.message.u.name}`,
					message_link: data.message._id,
					ts: data.message.ts,
					extraTitle: props.localReply && 'пересланне сообщение',
					title: data.message.msg,
				}}
			/>
			<Content {...props} />
			<Urls {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
			<Thread {...props} />
		</>
	);
};


const MessageInner = React.memo((props: IMessageInner) => {
	if (isReplyMessage(props.msg)) {
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

export default MessageTouchable;
