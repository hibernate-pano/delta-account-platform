package com.delta.account.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class ApiLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // 只记录API请求
        if (!httpRequest.getRequestURI().startsWith("/api")) {
            chain.doFilter(request, response);
            return;
        }

        long startTime = System.currentTimeMillis();
        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(httpRequest);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(httpResponse);

        try {
            chain.doFilter(requestWrapper, responseWrapper);
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            // 记录请求日志
            String requestBody = new String(requestWrapper.getContentAsByteArray(), StandardCharsets.UTF_8);
            if (requestBody.length() > 500) {
                requestBody = requestBody.substring(0, 500) + "...";
            }

            log.info("API Request: method={}, uri={}, query={}, body={}, duration={}ms, status={}",
                    httpRequest.getMethod(),
                    httpRequest.getRequestURI(),
                    httpRequest.getQueryString(),
                    requestBody,
                    duration,
                    httpResponse.getStatus());

            responseWrapper.copyBodyToResponse();
        }
    }
}
