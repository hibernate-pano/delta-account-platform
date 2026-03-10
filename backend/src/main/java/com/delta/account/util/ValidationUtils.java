package com.delta.account.util;

import java.util.regex.Pattern;

/**
 * Validation utilities
 */
public class ValidationUtils {

    private static final Pattern URL_PATTERN = Pattern.compile(
            "^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w .-]*)*/?$",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern IMAGE_URL_PATTERN = Pattern.compile(
            "(?i)^(https?:)?//.*\\.(jpg|jpeg|png|gif|webp|svg)(\\?.*)?$"
    );

    /**
     * Validate if a string is a valid URL
     */
    public static boolean isValidUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        return URL_PATTERN.matcher(url).matches();
    }

    /**
     * Validate if a string looks like an image URL
     */
    public static boolean isImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        return IMAGE_URL_PATTERN.matcher(url).matches();
    }

    /**
     * Validate image URLs in a list
     */
    public static boolean areValidImageUrls(java.util.List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            return true;
        }
        return urls.stream().allMatch(ValidationUtils::isImageUrl);
    }
}
