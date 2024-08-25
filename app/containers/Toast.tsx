import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import EventEmitter from '../lib/methods/helpers/events';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create({
	toast: {
		maxWidth: 300,
		padding: 10
	},
	text: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

export const LISTENER = 'Toast';

let listener: Function;
let toast: EasyToast | null | undefined;

type PropsType = {
	listenerEvent?: string;
};

const Toast = ({ listenerEvent = LISTENER }: PropsType): React.ReactElement => {
	const { colors } = useTheme();

	useEffect(() => {
		listener = EventEmitter.addEventListener(listenerEvent, showToast);
		return () => {
			EventEmitter.removeListener(LISTENER, listener);
		};
	}, [listenerEvent]);

	const getToastRef = (newToast: EasyToast | null) => (toast = newToast);

	const showToast = ({ message }: { message: string }) => {
		if (toast && toast.show) {
			toast.show(message, 1000);
		}
	};

	return (
		<EasyToast
			ref={getToastRef}
			position='center'
			style={[styles.toast, { backgroundColor: colors.surfaceDark }]}
			textStyle={[styles.text, { color: colors.fontWhite }]}
			opacity={0.9}
		/>
	);
};

export default Toast;
