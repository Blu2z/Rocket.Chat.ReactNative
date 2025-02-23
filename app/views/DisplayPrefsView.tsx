import React, { useEffect } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import Touchable from 'react-native-platform-touchable';
import { Switch, View, Text, Image } from 'react-native';
import { RadioButton } from 'react-native-ui-lib';
import { useDispatch } from 'react-redux';

import { setPreference } from '../actions/sortPreferences';
import { DisplayMode, SortBy } from '../lib/constants';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import { ICON_SIZE } from '../containers/List/constants';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import { IPreferences } from '../definitions';
import I18n from '../i18n';
import { SettingsStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { events, logEvent } from '../lib/methods/helpers/log';
import { saveSortPreference } from '../lib/methods';
import { useAppSelector } from '../lib/hooks';

export const backgroundImages = {
	light: [
		require('../static/images/chat-bg-pattern-light1_rocket.png'),
		require('../static/images/chat-bg-pattern-light2_rocket.png'),
		require('../static/images/chat-bg-pattern-light3_rocket.png'),
		require('../static/images/chat-bg-pattern-light4_rocket.png'),
	],
	dark: [
		require('../static/images/chat-bg-pattern-dark1_rocket.png'),
		require('../static/images/chat-bg-pattern-dark2_rocket.png'),
		require('../static/images/chat-bg-pattern-dark3_rocket.png'),
		require('../static/images/chat-bg-pattern-dark4_rocket.png')
	],
	black: [
		require('../static/images/chat-bg-pattern-black1_rocket.png'),
		require('../static/images/chat-bg-pattern-black2_rocket.png'),
		require('../static/images/chat-bg-pattern-black3_rocket.png'),
		require('../static/images/chat-bg-pattern-black4_rocket.png')
	],
}

const DisplayPrefsView = (): React.ReactElement => {
	const navigation = useNavigation<StackNavigationProp<SettingsStackParamList, 'DisplayPrefsView'>>();
	const { colors, theme } = useTheme();

	const { sortBy, groupByType, showFavorites, showUnread, showAvatar, displayMode, background = 0 } = useAppSelector(
		state => state.sortPreferences
	);
	const { isMasterDetail } = useAppSelector(state => state.app);
	const dispatch = useDispatch();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Display')
		});
		if (!isMasterDetail) {
			navigation.setOptions({
				headerLeft: () => <HeaderButton.Drawer navigation={navigation} testID='display-view-drawer' />
			});
		}
	}, [isMasterDetail, navigation]);

	const setSortPreference = (param: Partial<IPreferences>) => {
		dispatch(setPreference(param));
		saveSortPreference(param);
	};

	const sortByName = () => {
		logEvent(events.DP_SORT_CHANNELS_BY_NAME);
		setSortPreference({ sortBy: SortBy.Alphabetical });
	};

	const sortByActivity = () => {
		logEvent(events.DP_SORT_CHANNELS_BY_ACTIVITY);
		setSortPreference({ sortBy: SortBy.Activity });
	};

	const toggleGroupByType = () => {
		logEvent(events.DP_GROUP_CHANNELS_BY_TYPE);
		setSortPreference({ groupByType: !groupByType });
	};

	const toggleGroupByFavorites = () => {
		logEvent(events.DP_GROUP_CHANNELS_BY_FAVORITE);
		setSortPreference({ showFavorites: !showFavorites });
	};

	const toggleUnread = () => {
		logEvent(events.DP_GROUP_CHANNELS_BY_UNREAD);
		setSortPreference({ showUnread: !showUnread });
	};

	const toggleAvatar = () => {
		logEvent(events.DP_TOGGLE_AVATAR);
		setSortPreference({ showAvatar: !showAvatar });
	};

	const displayExpanded = () => {
		logEvent(events.DP_DISPLAY_EXPANDED);
		setSortPreference({ displayMode: DisplayMode.Expanded });
	};

	const displayCondensed = () => {
		logEvent(events.DP_DISPLAY_CONDENSED);
		setSortPreference({ displayMode: DisplayMode.Condensed });
	};

	const toggleBackground = (type: number) => () => {
		logEvent(events.DP_TOGGLE_AVATAR);
		setSortPreference({ background: type });
	};

	const renderCheckBox = (value: boolean) => (
		<List.Icon name={value ? 'checkbox-checked' : 'checkbox-unchecked'} color={value ? colors.actionTintColor : null} />
	);

	const renderAvatarSwitch = (value: boolean) => (
		<Switch value={value} onValueChange={() => toggleAvatar()} testID='display-pref-view-avatar-switch' />
	);

	const renderRadio = (value: boolean) => (
		<RadioButton selected={!!value} color={value ? colors.actionTintColor : colors.auxiliaryText} size={ICON_SIZE} />
	);

	return (
		<SafeAreaView>
			<StatusBar />
			<List.Container testID='display-view-list'>
				<List.Section title='Display'>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='view-extended' />}
						title='Expanded'
						testID='display-pref-view-expanded'
						right={() => renderRadio(displayMode === DisplayMode.Expanded)}
						onPress={displayExpanded}
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='view-medium' />}
						title='Condensed'
						testID='display-pref-view-condensed'
						right={() => renderRadio(displayMode === DisplayMode.Condensed)}
						onPress={displayCondensed}
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='avatar' />}
						title='Avatars'
						testID='display-pref-view-avatars'
						right={() => renderAvatarSwitch(showAvatar)}
					/>
					<List.Separator />
					<View
						style={{
							backgroundColor: colors.backgroundColor,
						}}
					>	
						<View style={{
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'flex-start', 
							paddingHorizontal: 14 
						}}>
							<View style={{ paddingRight: 12 }}>
								<List.Icon name='avatar' />
							</View>
							<Text style={{ fontSize: 16, marginVertical: 10, color: colors.bodyText }}>Обои</Text>
						</View>
						<View 
							style={{
								display: 'flex',
								flexDirection: 'row', 
								gap: 10,
								justifyContent: 'space-around',
								// alignItems: 'center',
								paddingHorizontal: 10,
								paddingBottom: 8,
								borderRadius: 10,
								// overflow: 'hidden'
							}}
						>
							{backgroundImages[theme].map((item, index) => (
								<Touchable 

									key={index}
									onPress={toggleBackground(index)}
									style={{ 
										flex: 1, 
										// width: '30%', 
										height: 100, 
										overflow: 'hidden',
										borderRadius: 10,
										borderColor: background === index ? 'red' : 'transparent',
										borderWidth: 4,
									}}
								>
									<Image 
										style={{ height: '100%', width: '100%', resizeMode: 'stretch' }}
										source={backgroundImages[theme][index]}/>
								</Touchable>
								)
							)}
						</View>
					</View>
				</List.Section>

				<List.Section title='Sort_by'>
					<List.Separator />
					<List.Item
						title='Activity'
						testID='display-pref-view-activity'
						left={() => <List.Icon name='clock' />}
						onPress={sortByActivity}
						right={() => renderRadio(sortBy === SortBy.Activity)}
					/>
					<List.Separator />
					<List.Item
						title='Name'
						testID='display-pref-view-name'
						left={() => <List.Icon name='sort-az' />}
						onPress={sortByName}
						right={() => renderRadio(sortBy === SortBy.Alphabetical)}
					/>
					<List.Separator />
				</List.Section>

				<List.Section title='Group_by'>
					<List.Separator />
					<List.Item
						title='Unread_on_top'
						testID='display-pref-view-unread'
						left={() => <List.Icon name='flag' />}
						onPress={toggleUnread}
						right={() => renderCheckBox(showUnread)}
					/>
					<List.Separator />
					<List.Item
						title='Favorites'
						testID='display-pref-view-favorites'
						left={() => <List.Icon name='star' />}
						onPress={toggleGroupByFavorites}
						right={() => renderCheckBox(showFavorites)}
					/>
					<List.Separator />
					<List.Item
						title='Types'
						testID='display-pref-view-types'
						left={() => <List.Icon name='group-by-type' />}
						onPress={toggleGroupByType}
						right={() => renderCheckBox(groupByType)}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default DisplayPrefsView;
