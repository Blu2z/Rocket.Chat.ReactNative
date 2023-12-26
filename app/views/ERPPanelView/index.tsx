import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';

import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import * as HeaderButton from '../../containers/HeaderButton';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { ERPPanelStackParamList } from '../../stacks/types';
import { IApplicationState } from '../../definitions';

const ERPPanelView = () => {
	const navigation = useNavigation<StackNavigationProp<ERPPanelStackParamList, 'ERPPanelView'>>();
	const baseUrl = useSelector((state: IApplicationState) => state.server.server);
	const erp = useSelector((state: IApplicationState) => getUserSelector(state).erp);
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);

	useEffect(() => {
		navigation.setOptions({
			headerLeft: isMasterDetail ? undefined : () => <HeaderButton.Drawer navigation={navigation} />,
			title: I18n.t('ERP_Panel')
		});
	}, [isMasterDetail, navigation]);

	if (!baseUrl) {
		return null;
	}

	const str = erp?.apiKey 
		?  `localStorage.setItem(USER_KEY, ${erp.apiKey});localStorage.setItem(USER_NAME, ${erp.username});localStorage.setItem(USER_ID, ${erp.userId});` 
		: '';

	return (
		<SafeAreaView>
			<StatusBar />
			<WebView
				// https://github.com/react-native-community/react-native-webview/issues/1311
				onMessage={() => {}}
				source={{ uri: erp?.apiKey ? `https://clt.gepur.org` : `https://clt.gepur.org/login` }}
				injectedJavaScript={str}
			/>
		</SafeAreaView>
	);
};

export default ERPPanelView;
