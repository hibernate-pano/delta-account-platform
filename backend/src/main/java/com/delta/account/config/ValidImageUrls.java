package com.delta.account.config;

import com.delta.account.util.ValidationUtils;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.*;
import java.util.Arrays;
import java.util.List;

/**
 * Valid image URLs validation annotation
 */
@Documented
@Constraint(validatedBy = ValidImageUrls.Validator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidImageUrls {

    String message() default "无效的图片URL格式";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<ValidImageUrls, String> {

        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            if (value == null || value.isBlank()) {
                return true; // Let @NotNull handle empty case
            }

            // Split by comma and validate each URL
            List<String> urls = Arrays.asList(value.split(","));
            for (String url : urls) {
                String trimmedUrl = url.trim();
                if (!trimmedUrl.isEmpty() && !ValidationUtils.isImageUrl(trimmedUrl)) {
                    return false;
                }
            }
            return true;
        }
    }
}
