import React from 'react';
import { Text } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import styles from './styles';
import { LISTENER } from '../Toast';
import EventEmitter from '../../utils/events';
import I18n from '../../i18n';
import openLink from '../../utils/openLink';
import { TOnLinkPress } from './interfaces';
import { useTheme } from '../../theme';

interface ILink {
	children: React.ReactElement | null;
	link: string;
	onLinkPress?: TOnLinkPress;
}

const Link = React.memo(({ children, link, onLinkPress }: ILink) => {
	const { colors, theme } = useTheme();

	const handlePress = () => {
		if (!link) {
			return;
		}
		if (onLinkPress) {
			return onLinkPress(link);
		}
		openLink(link, theme);
	};

	const childLength = React.Children.toArray(children).filter(o => o).length;
	const onLongPress = () => {
		Clipboard.setString(link);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	// if you have a [](https://rocket.chat) render https://rocket.chat
	return (
		<Text onPress={handlePress} onLongPress={onLongPress} style={{ ...styles.link, color: colors.actionTintColor }}>
			{childLength !== 0 ? children : link}
		</Text>
	);
});

export default Link;
