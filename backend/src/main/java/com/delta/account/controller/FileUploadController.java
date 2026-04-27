package com.delta.account.controller;

import com.delta.account.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Tag(name = "文件上传")
public class FileUploadController {

    @Value("${upload.path:uploads}")
    private String uploadPath;

    @Value("${upload.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    @Value("${upload.max-size:5242880}")  // 5MB default
    private long maxSize;

    private static final String[] ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"};
    private static final String[] ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"};

    @PostMapping("/image")
    @Operation(summary = "上传单张图片")
    public Result<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            return Result.success(uploadSingleFile(file));
        } catch (IOException e) {
            log.error("Upload failed", e);
            return Result.error("上传失败: " + e.getMessage());
        }
    }

    @PostMapping("/images")
    @Operation(summary = "上传多张图片")
    public Result<List<String>> uploadImages(@RequestParam("files") MultipartFile[] files) {
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                try {
                    urls.add(uploadSingleFile(file));
                } catch (Exception e) {
                    log.error("Failed to upload file: {}", file.getOriginalFilename(), e);
                }
            }
        }
        return Result.success(urls);
    }

    @DeleteMapping("/image")
    @Operation(summary = "删除图片")
    public Result<Void> deleteImage(@RequestParam("url") String imageUrl) {
        try {
            String filePath = extractFilePath(imageUrl);
            File file = new File(filePath);
            if (file.exists()) {
                file.delete();
            }
            return Result.success((Void) null);
        } catch (Exception e) {
            log.error("Failed to delete image: {}", imageUrl, e);
            return Result.error("删除失败");
        }
    }

    private String uploadSingleFile(MultipartFile file) throws IOException {
        // 验证文件
        validateFile(file);

        // 创建上传目录
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String uploadDir = uploadPath + "/" + datePath;
        Path dirPath = Paths.get(uploadDir);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString().replace("-", "") + extension;

        // 保存文件
        Path filePath = dirPath.resolve(fileName);
        file.transferTo(filePath.toFile());

        // 返回URL
        String fileUrl = baseUrl + "/" + datePath + "/" + fileName;
        log.info("File uploaded: {}, size: {} bytes", fileUrl, file.getSize());

        return fileUrl;
    }

    private void validateFile(MultipartFile file) {
        // 检查文件大小
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("文件大小不能超过 " + (maxSize / 1024 / 1024) + "MB");
        }

        // 检查文件类型
        String contentType = file.getContentType();
        boolean isAllowed = false;
        for (String type : ALLOWED_TYPES) {
            if (type.equals(contentType)) {
                isAllowed = true;
                break;
            }
        }
        if (!isAllowed) {
            throw new IllegalArgumentException("不支持的文件类型: " + contentType);
        }

        // 检查文件扩展名
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            boolean extAllowed = false;
            for (String ext : ALLOWED_EXTENSIONS) {
                if (ext.equals(extension)) {
                    extAllowed = true;
                    break;
                }
            }
            if (!extAllowed) {
                throw new IllegalArgumentException("不支持的文件扩展名: " + extension);
            }
        }

        // 检查是否为空
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }
    }

    private String extractFilePath(String url) {
        // 从URL中提取文件路径
        if (url.startsWith(baseUrl)) {
            return url.substring(baseUrl.length());
        }
        // 如果是相对路径
        if (url.startsWith("/uploads")) {
            return url;
        }
        return uploadPath + url.substring(url.indexOf("/uploads") + 8);
    }

    /**
     * 提供静态文件访问
     * 这个方法由 Spring Boot 的静态资源处理自动处理
     * 只需要确保配置了 upload.path 和 base-url 即可
     */
}