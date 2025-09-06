package com.toolrent.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "keycloak")
public class KeycloakConfigProperties {

    private String authServerUrl;
    private String realm;
    private String resource;

    // Default constructor
    public KeycloakConfigProperties() {}

    // Getters and Setters
    public String getAuthServerUrl() {
        return authServerUrl;
    }

    public void setAuthServerUrl(String authServerUrl) {
        this.authServerUrl = authServerUrl;
    }

    public String getRealm() {
        return realm;
    }

    public void setRealm(String realm) {
        this.realm = realm;
    }

    public String getResource() {
        return resource;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

    // Helper methods
    public boolean isConfigured() {
        return authServerUrl != null && !authServerUrl.trim().isEmpty() &&
                realm != null && !realm.trim().isEmpty() &&
                resource != null && !resource.trim().isEmpty();
    }

    public String getTokenUrl() {
        if (!isConfigured()) {
            return null;
        }
        return String.format("%s/realms/%s/protocol/openid-connect/token",
                authServerUrl, realm);
    }

    public String getUserInfoUrl() {
        if (!isConfigured()) {
            return null;
        }
        return String.format("%s/realms/%s/protocol/openid-connect/userinfo",
                authServerUrl, realm);
    }

    public String getAuthUrl() {
        if (!isConfigured()) {
            return null;
        }
        return String.format("%s/realms/%s/protocol/openid-connect/auth",
                authServerUrl, realm);
    }

    public String getLogoutUrl() {
        if (!isConfigured()) {
            return null;
        }
        return String.format("%s/realms/%s/protocol/openid-connect/logout",
                authServerUrl, realm);
    }
}