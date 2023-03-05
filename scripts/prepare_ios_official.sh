#!/usr/bin/env bash

sed -i '' \
	's/PRODUCT_BUNDLE_IDENTIFIER = org.gepur.demo.ShareExtension;/PRODUCT_BUNDLE_IDENTIFIER = org.gepur.demo.Rocket-Chat-ShareExtension;/' \
	../RocketChatRN.xcodeproj/project.pbxproj

sed -i '' \
	's/PRODUCT_BUNDLE_IDENTIFIER = org.gepur.demo.NotificationService;/PRODUCT_BUNDLE_IDENTIFIER = org.gepur.demo.NotificationService;/' \
	../RocketChatRN.xcodeproj/project.pbxproj