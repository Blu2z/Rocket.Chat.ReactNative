import React from 'react';
import { StyleSheet, SafeAreaView, View, Text } from 'react-native';
import moment from 'moment';
import * as HeaderButton from '../HeaderButton';
import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';

type Props = {
	title?: string;
	time?: string;
	count?: string;
	onRequestClose: () => void;
	handleSave: () => void;
};

const ImageHeader = ({ title, onRequestClose, time, count, handleSave }: Props) => {
	const { theme } = useTheme();

	return (
		<SafeAreaView style={styles.root}>
			<View style={styles.container}>
				<HeaderButton.CloseModal testID='close-attachment-view' onPress={onRequestClose} color={themes[theme].previewTintColor} />
				<View style={styles.headerText}>
					{title && <Text style={styles.text}>{title}</Text>}
					{time && <Text style={styles.textTime}>{moment(time).format('MMMM Do YYYY, h:mm:ss')}</Text>}
				</View>
				{/* <HeaderButton.Download testID='save-image' onPress={handleSave} color={themes[theme].previewTintColor} /> */}
			</View>
			{count && (
				<View style={styles.count}>
					<Text style={styles.textCount}>{count}</Text>
				</View>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	root: {
		backgroundColor: '#00000077'
	},
	container: {
		flex: 1,
		padding: 8,
		paddingBottom: 0,
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	count: {
		width: '100%',
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	headerText: {
		flex: 1,
		padding: 8,
		flexDirection: 'column',
		justifyContent: 'space-between'
	},
	space: {
		width: 5,
		height: 45
	},
	closeButton: {
		width: 45,
		height: 45,
		alignItems: 'center',
		justifyContent: 'center'
	},
	closeText: {
		lineHeight: 25,
		fontSize: 25,
		paddingTop: 2,
		includeFontPadding: false,
		color: '#FFF'
	},
	text: {
		maxWidth: 240,
		flex: 1,
		flexWrap: 'wrap',
		fontSize: 14,
		lineHeight: 14,
		color: '#FFF'
	},
	textTime: {
		maxWidth: 240,
		marginTop: 6,
		flex: 1,
		flexWrap: 'wrap',
		fontSize: 12,
		lineHeight: 12,
		color: '#FFF'
	},
	textCount: {
		maxWidth: 240,
		marginTop: 6,
		flex: 1,
		alignItems: 'center',
		flexWrap: 'wrap',
		fontSize: 12,
		lineHeight: 12,
		color: '#FFF',
		justifyContent: 'center',
		textAlign: 'center'
	}
});

export default ImageHeader;
