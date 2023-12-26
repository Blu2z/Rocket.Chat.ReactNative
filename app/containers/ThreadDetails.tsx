import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import I18n from '../i18n';

import { CustomIcon } from './CustomIcon';
import { themes } from '../lib/constants';
import sharedStyles from '../views/Styles';
import { useTheme } from '../theme';
import { TThreadModel } from '../definitions/IThread';

const styles = StyleSheet.create({
	container: {
		flex: 0,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		minWidth: 100,
	},
	detailsContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	detailContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 8,
	},
	detailText: {
		fontSize: 10,
		marginLeft: 2,
		...sharedStyles.textSemibold
	},
	badgeContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	badge: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 8
	}
});

interface IThreadDetails {
	item: Pick<TThreadModel, 'tcount' | 'replies' | 'id'>;
	user: {
		id: string;
	};
	badgeColor?: string;
	toggleFollowThread: Function;
	style: ViewStyle;
}

const numWord = (val: number, words: ['string', 'string', 'string']): string => {  
	const value = Math.abs(val) % 100; 
	var num = value % 10;
	if(value > 10 && value < 20) {
		return words[2];
	}
	
	if(num > 1 && num < 5) {
		return words[1];
	}

	if(num == 1) {
		return words[0];
	}

	return words[2];
}

const ThreadDetails = ({ item, user, badgeColor, toggleFollowThread, style }: IThreadDetails): JSX.Element => {
	const { theme } = useTheme();
	let count: string | number  = item.tcount || 0;
	const commentPhrase = numWord(count, [I18n.t('comment'), I18n.t('comment_min5'), I18n.t('comments')]);
	
	if (count && count >10 && count % 11) {}

	if (count && count >= 1000) {
		count = '+999';
	}

	let replies: number | string = item?.replies?.length ?? 0;
	if (replies >= 1000) {
		replies = '+999';
	}

	const isFollowing = item.replies?.find((u: string) => u === user?.id);

	return (
		<View style={[styles.container, style]}>
			<View style={styles.detailsContainer}>
				<View 
					style={[
						styles.detailContainer, 
						{ 
							backgroundColor: themes[theme].mentionGroupColor,
							paddingLeft: 2,
							paddingRight: 8,
							borderRadius: 12,
						}
					]}>
					<CustomIcon name='user' size={24} color={'#fff'} />
					<Text style={[styles.detailText, { color: '#fff' }]} numberOfLines={1}>
						{replies}
					</Text>
				</View>
				<Text style={{ fontSize: 16, color: themes[theme].bodyText, flex: 0 }} numberOfLines={1}>
					{count} {commentPhrase}
				</Text>
				<CustomIcon name='chevron-right' size={24} color={themes[theme].bodyText} />
			</View>
			<View style={styles.badgeContainer}>
				{badgeColor ? <View style={[styles.badge, { backgroundColor: badgeColor }]} /> : null}
				<Touchable onPress={() => toggleFollowThread?.(isFollowing, item.id)}>
					<CustomIcon
						size={24}
						name={isFollowing ? 'notification' : 'notification-disabled'}
						color={themes[theme].auxiliaryTintColor}
					/>
				</Touchable>
			</View>
		</View>
	);
};

export default ThreadDetails;
