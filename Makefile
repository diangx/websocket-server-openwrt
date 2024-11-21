include $(TOPDIR)/rules.mk

PKG_NAME:=websocket-server-openwrt
PKG_VERSION:=1.0
PKG_RELEASE:=1

PKG_BUILD_DIR := $(BUILD_DIR)/$(PKG_NAME)

EXE = websocket-server-openwrt.js
INIT_SCRIPT = websocket-server-openwrt.init

PKG_MAINTAINER:=Jiwan Kim <wldhks1004@naver.com>

include $(INCLUDE_DIR)/package.mk

define Package/websocket-server-openwrt
  CATEGORY:=Utilities
  SECTION:=utils
  TITLE:=WebSocket Server
  DEPENDS:=+node +node-npm
endef

define Package/websocket-server-openwrt/description
  A WebSocket server built with Node.js, with ws module installed during build.
endef

# Prepare the build environment
define Build/Prepare
		mkdir -p $(PKG_BUILD_DIR)
		$(CP) ./files/* $(PKG_BUILD_DIR)/
endef

# Install ws module during the build process
define Build/Compile
		cd $(PKG_BUILD_DIR); npm install ws --production
endef

define Package/websocket-server-openwrt/install
	$(INSTALL_DIR) $(1)/usr/share/websocket-server-openwrt
	$(CP) $(PKG_BUILD_DIR)/*.js $(1)/usr/share/websocket-server-openwrt/
	$(CP) -r $(PKG_BUILD_DIR)/node_modules $(1)/usr/share/websocket-server-openwrt/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/websocket-server-openwrt.init $(1)/etc/init.d/websocket-server-openwrt
endef

$(eval $(call BuildPackage,websocket-server-openwrt))