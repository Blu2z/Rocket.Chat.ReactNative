import React from 'react';
import { Text } from 'react-native';

import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { TIconsName } from '../CustomIcon';
import { IItemService, IOauthProvider } from './interfaces';
import styles from './styles';
import * as ServiceLogin from './serviceLogin';
import ButtonService from './ButtonService';

const ServicesList = React.memo(
	({
		CAS_enabled,
		CAS_login_url,
		Gitlab_URL,
		server,
		service
	}: {
		service: IItemService;
		server: string;
		Gitlab_URL: string;
		CAS_enabled: boolean;
		CAS_login_url: string;
		storiesTestOnPress?: () => void;
	}) => {
		const { colors } = useTheme();

		let { name } = service;
		name = name === 'meteor-developer' ? 'meteor' : name;
		const icon = `${name}-monochromatic` as TIconsName;
		const isSaml = service.service === 'saml';
		let onPress: any = () => {};

		const getSocialOauthProvider = (name: string) => {
			const oauthProviders: IOauthProvider = {
				facebook: () => ServiceLogin.onPressFacebook({ service, server }),
				github: () => ServiceLogin.onPressGithub({ service, server }),
				gitlab: () => ServiceLogin.onPressGitlab({ service, server, urlOption: Gitlab_URL }),
				google: () => ServiceLogin.onPressGoogle({ service, server }),
				linkedin: () => ServiceLogin.onPressLinkedin({ service, server }),
				'meteor-developer': () => ServiceLogin.onPressMeteor({ service, server }),
				twitter: () => ServiceLogin.onPressTwitter({ service, server }),
				wordpress: () => ServiceLogin.onPressWordpress({ service, server })
			};
			return oauthProviders[name];
		};

		switch (service.authType) {
			case 'oauth': {
				onPress = getSocialOauthProvider(service.name);
				break;
			}
			case 'oauth_custom': {
				onPress = () => ServiceLogin.onPressCustomOAuth({ loginService: service, server });
				break;
			}
			case 'saml': {
				onPress = () => ServiceLogin.onPressSaml({ loginService: service, server });
				break;
			}
			case 'cas': {
				onPress = () => ServiceLogin.onPressCas({ casLoginUrl: CAS_login_url, server });
				break;
			}
			case 'apple': {
				onPress = () => ServiceLogin.onPressAppleLogin();
				break;
			}
			default:
				break;
		}

		name = name.charAt(0).toUpperCase() + name.slice(1);
		let buttonText;
		if (isSaml || (service.service === 'cas' && CAS_enabled)) {
			buttonText = <Text style={[styles.serviceName, isSaml && { color: service.buttonLabelColor }]}>{name}</Text>;
		} else {
			buttonText = (
				<>
					{I18n.t('Continue_with')} <Text style={styles.serviceName}>{name}</Text>
				</>
			);
		}

		const backgroundColor = isSaml && service.buttonColor ? service.buttonColor : colors.chatComponentBackground;

		return (
			<ButtonService
				onPress={onPress}
				backgroundColor={backgroundColor}
				buttonText={buttonText}
				icon={icon}
				name={service.name}
				authType={service.authType}
			/>
		);
	}
);

export default ServicesList;
