-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               12.1.2-MariaDB - MariaDB Server
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for fashion_store
CREATE DATABASE IF NOT EXISTS `fashion_store` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `fashion_store`;

-- Dumping structure for table fashion_store.activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_logs_user` (`user_id`),
  KEY `idx_logs_action` (`action`),
  KEY `idx_logs_date` (`created_at`),
  CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.activity_logs: ~8 rows (approximately)
INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
	(1, 6, 'update_order_status', 'order', '19', '"Updated order status to processing"', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-01-24 03:54:30.198'),
	(2, 6, 'Cập nhật sản phẩm', 'product', '1', '{"diff":{"brand_id":{"from":null,"to":"1"},"meta_title":{"from":null,"to":""},"meta_description":{"from":null,"to":""},"meta_keywords":{"from":null,"to":""},"tags":{"from":null,"to":""}},"updates":{"category_id":1,"brand_id":"1","sku":"89","name":"Set Bộ Áo Thun Nữ Form Rộng Tay Lỡ + Quần Short","slug":"set-bo-ao-thun-nu-form-rong-tay-lo","description":"<p>Chất liệu cotton su. and</p>","compare_at_price":65000,"is_active":true,"variants":[{"variant_sku":"set-bo-ao-thun-nu-form-rong-tay-lo-quan-short-ong-rong-89-trang","sku":"set-bo-ao-thun-nu-form-rong-tay-lo-quan-short-ong-rong-89-trang","price":75000,"stock_qty":0,"is_active":true,"options":{},"id":13}],"attributes":[],"images":[{"url":"http://localhost:4000/uploads/1769094301311-794242468.png","is_primary":true,"sort_order":0},{"url":"http://localhost:4000/uploads/1769094312782-549414451.webp","is_primary":false,"sort_order":1}],"meta_title":"","meta_description":"","meta_keywords":"","tags":"","weight":0,"length":0,"width":0,"height":0}}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-01-26 03:21:21.297'),
	(3, 6, 'create_order', 'order', '123', '"Created order FS20260126-6980"', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-01-26 03:54:22.050'),
	(4, 59, 'create_order', 'order', '124', '"Created order FS20260126-2042"', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-01-26 04:20:36.156'),
	(5, 59, 'create_order', 'order', '125', '"Created order FS20260127-1416"', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-01-27 08:08:39.784'),
	(6, 59, 'create_order', 'order', '126', '"Created order FS20260129-8544"', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-01-29 06:53:36.758'),
	(7, 6, 'update_order_status', 'order', '126', '"Updated order status to shipped"', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-29 06:55:38.068'),
	(8, 6, 'update_order_status', 'order', '125', '"Updated order status to completed"', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-29 09:30:41.427');

-- Dumping structure for table fashion_store.banners
CREATE TABLE IF NOT EXISTS `banners` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(500) DEFAULT NULL,
  `image_url` varchar(1000) NOT NULL,
  `link_url` varchar(1000) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `position` varchar(50) NOT NULL DEFAULT 'home_hero',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `start_date` datetime(3) DEFAULT NULL,
  `end_date` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_banners_position` (`position`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.banners: ~3 rows (approximately)
INSERT INTO `banners` (`id`, `title`, `subtitle`, `image_url`, `link_url`, `button_text`, `position`, `sort_order`, `is_active`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
	(1, 'Mảnh ký ức', '', 'http://localhost:4000/uploads/1769502904792-391252114.jpg', '', '', 'home_hero', 0, 1, '2026-01-26 00:00:00.000', '2026-03-27 00:00:00.000', '2026-01-27 08:35:53.394', '2026-01-27 08:56:25.066'),
	(2, 'Paris', NULL, 'http://localhost:4000/uploads/1769502966434-606714611.jpg', NULL, NULL, 'home_promo', 0, 1, NULL, NULL, '2026-01-27 08:36:19.132', '2026-01-27 08:36:19.132'),
	(3, 'Chạm đông', NULL, 'http://localhost:4000/uploads/1769502993564-497163475.jpg', NULL, NULL, 'category_top', 0, 1, NULL, NULL, '2026-01-27 08:36:45.583', '2026-01-27 08:36:51.430');

-- Dumping structure for table fashion_store.banner_images
CREATE TABLE IF NOT EXISTS `banner_images` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `banner_id` bigint(20) unsigned NOT NULL,
  `image_url` varchar(1000) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_bi_banner` (`banner_id`),
  CONSTRAINT `banner_images_banner_id_fkey` FOREIGN KEY (`banner_id`) REFERENCES `banners` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.banner_images: ~3 rows (approximately)
INSERT INTO `banner_images` (`id`, `banner_id`, `image_url`, `sort_order`, `created_at`) VALUES
	(1, 1, 'http://localhost:4000/uploads/1769502904792-391252114.jpg', 0, '2026-01-27 08:56:25.066'),
	(2, 1, 'http://localhost:4000/uploads/1769504180335-464240027.jpg', 1, '2026-01-27 08:56:25.066'),
	(3, 1, 'http://localhost:4000/uploads/1769504180354-4767673.jpg', 2, '2026-01-27 08:56:25.066');

-- Dumping structure for table fashion_store.brands
CREATE TABLE IF NOT EXISTS `brands` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `logo` varchar(1000) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_slug_key` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.brands: ~4 rows (approximately)
INSERT INTO `brands` (`id`, `name`, `slug`, `logo`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'Hades Studio', 'hades-studio', NULL, NULL, 1, '2026-01-22 21:09:18.533', NULL),
	(2, 'Coolmate', 'coolmate', NULL, NULL, 1, '2026-01-22 21:09:18.533', NULL),
	(3, 'Levents', 'levents', NULL, NULL, 1, '2026-01-22 21:09:18.533', NULL),
	(4, 'Uniqlo', 'uniqlo', NULL, NULL, 1, '2026-01-22 21:09:18.533', NULL);

-- Dumping structure for table fashion_store.carts
CREATE TABLE IF NOT EXISTS `carts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `session_id` varchar(128) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_carts_user` (`user_id`),
  KEY `idx_carts_session` (`session_id`),
  CONSTRAINT `carts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.carts: ~6 rows (approximately)
INSERT INTO `carts` (`id`, `user_id`, `session_id`, `created_at`, `updated_at`) VALUES
	(1, 2, NULL, '2026-01-22 21:09:18.707', NULL),
	(2, 3, NULL, '2026-01-22 21:09:18.707', NULL),
	(3, NULL, 'sess_guest_abc123', '2026-01-22 21:09:18.707', NULL),
	(4, NULL, 'sess_1769175589975_62qeigcon', '2026-01-23 13:40:10.788', '2026-01-23 13:40:10.788'),
	(5, 6, NULL, '2026-01-23 16:54:51.891', '2026-01-23 16:54:51.891'),
	(6, 59, NULL, '2026-01-26 04:20:15.652', '2026-01-26 04:20:15.652'),
	(7, 60, NULL, '2026-01-29 12:11:59.491', '2026-01-29 12:11:59.491');

-- Dumping structure for table fashion_store.cart_items
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) unsigned NOT NULL,
  `variant_id` bigint(20) unsigned NOT NULL,
  `qty` int(11) NOT NULL,
  `price_at_add` decimal(12,2) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cart_variant` (`cart_id`,`variant_id`),
  KEY `idx_ci_cart` (`cart_id`),
  KEY `idx_ci_variant` (`variant_id`),
  CONSTRAINT `cart_items_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.cart_items: ~6 rows (approximately)
INSERT INTO `cart_items` (`id`, `cart_id`, `variant_id`, `qty`, `price_at_add`, `created_at`) VALUES
	(1, 1, 1, 2, 99000.00, '2026-01-22 21:09:18.722'),
	(2, 1, 10, 1, 79000.00, '2026-01-22 21:09:18.722'),
	(3, 2, 6, 1, 109000.00, '2026-01-22 21:09:18.722'),
	(4, 3, 12, 1, 59000.00, '2026-01-22 21:09:18.722'),
	(11, 6, 1, 1, 99000.00, '2026-01-29 08:14:03.741'),
	(12, 7, 1, 1, 99000.00, '2026-01-29 12:11:59.495');

-- Dumping structure for table fashion_store.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_key` (`slug`),
  KEY `idx_categories_parent` (`parent_id`),
  CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.categories: ~10 rows (approximately)
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
	(1, NULL, 'Thời Trang Nữ', 'thoi-trang-nu', 1, 1, '2026-01-22 21:09:18.567', NULL),
	(2, NULL, 'Thời Trang Nam', 'thoi-trang-nam', 1, 2, '2026-01-22 21:09:18.567', NULL),
	(4, 1, 'Áo', 'nu-ao', 1, 1, '2026-01-22 21:09:18.567', NULL),
	(5, 1, 'Quần', 'nu-quan', 1, 2, '2026-01-22 21:09:18.567', NULL),
	(6, 1, 'Váy/Đầm', 'nu-vay-dam', 1, 3, '2026-01-22 21:09:18.567', NULL),
	(7, 2, 'Áo', 'nam-ao', 1, 1, '2026-01-22 21:09:18.567', NULL),
	(8, 2, 'Quần', 'nam-quan', 1, 2, '2026-01-22 21:09:18.567', NULL),
	(9, NULL, 'Túi', 'phu-kien-tui', 1, 1, '2026-01-22 21:09:18.567', NULL),
	(10, NULL, 'Mũ', 'phu-kien-mu', 1, 2, '2026-01-22 21:09:18.567', NULL),
	(11, NULL, 'Phụ kiện khác', 'phu-kien-khac', 1, 3, '2026-01-22 21:09:18.567', NULL);

-- Dumping structure for table fashion_store.category_options
CREATE TABLE IF NOT EXISTS `category_options` (
  `category_id` bigint(20) unsigned NOT NULL,
  `option_id` bigint(20) unsigned NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`category_id`,`option_id`),
  KEY `idx_co_option` (`option_id`),
  CONSTRAINT `category_options_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `category_options_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.category_options: ~0 rows (approximately)

-- Dumping structure for table fashion_store.chat_messages
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint(20) unsigned NOT NULL,
  `sender_type` enum('user','admin','system') NOT NULL DEFAULT 'user',
  `sender_id` bigint(20) unsigned DEFAULT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_msg_conv` (`conversation_id`),
  KEY `idx_msg_sender` (`sender_id`),
  CONSTRAINT `chat_messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.chat_messages: ~25 rows (approximately)
INSERT INTO `chat_messages` (`id`, `conversation_id`, `sender_type`, `sender_id`, `content`, `is_read`, `created_at`) VALUES
	(1, 1, 'user', NULL, 'xin chào ạ', 0, '2026-01-29 04:05:08.197'),
	(2, 1, 'user', NULL, 'chào shop', 0, '2026-01-29 04:17:41.988'),
	(3, 1, 'user', NULL, 'hello', 0, '2026-01-29 04:17:58.078'),
	(4, 1, 'admin', 6, 'chào bạn', 0, '2026-01-29 04:20:31.435'),
	(5, 1, 'admin', 6, 'hi', 0, '2026-01-29 04:20:37.701'),
	(6, 1, 'admin', 6, 'hi', 0, '2026-01-29 04:20:43.109'),
	(7, 2, 'admin', 6, 'chào bạn', 0, '2026-01-29 04:21:10.233'),
	(8, 2, 'admin', 6, 'chào bạn bạn cần hỗi trợ gì', 0, '2026-01-29 04:21:19.545'),
	(9, 3, 'admin', 6, 'shop ơi', 0, '2026-01-29 04:38:03.046'),
	(10, 3, 'admin', 6, 'bạn cần hỗ trợ gì ạ', 0, '2026-01-29 04:39:49.329'),
	(11, 3, 'admin', 6, 'alo shop', 0, '2026-01-29 04:40:29.107'),
	(12, 4, 'user', 59, 'shop oi', 0, '2026-01-29 04:53:08.112'),
	(13, 4, 'user', 59, 'shop oi', 0, '2026-01-29 04:53:24.971'),
	(14, 4, 'admin', 6, 'day', 0, '2026-01-29 04:53:35.269'),
	(15, 4, 'user', 59, 'shp', 0, '2026-01-29 04:53:59.309'),
	(16, 4, 'admin', 6, 'đây bạn', 0, '2026-01-29 04:54:04.585'),
	(17, 4, 'user', 59, 'hi', 0, '2026-01-29 05:20:24.652'),
	(18, 4, 'admin', 6, 'shop ơi', 0, '2026-01-29 05:20:32.511'),
	(19, 4, 'admin', 6, 'shop đây', 0, '2026-01-29 05:20:36.892'),
	(20, 4, 'admin', 6, 'mình đây bạn', 0, '2026-01-29 05:20:54.821'),
	(21, 4, 'user', 59, 'cho em hop hàng này còn bán không', 0, '2026-01-29 05:21:14.094'),
	(22, 4, 'admin', 6, 'còn nha bạn', 0, '2026-01-29 05:21:18.313'),
	(23, 4, 'admin', 6, 'lô bạn', 0, '2026-01-29 08:25:49.148'),
	(24, 4, 'user', 59, 'lô', 0, '2026-01-29 09:02:44.153'),
	(25, 5, 'user', 60, 'alo shop', 0, '2026-01-29 11:33:01.491');

-- Dumping structure for table fashion_store.collections
CREATE TABLE IF NOT EXISTS `collections` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `image` varchar(1000) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `collections_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.collections: ~0 rows (approximately)

-- Dumping structure for table fashion_store.conversations
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `guest_name` varchar(200) DEFAULT NULL,
  `guest_email` varchar(255) DEFAULT NULL,
  `status` enum('waiting','active','closed') NOT NULL DEFAULT 'waiting',
  `assigned_to` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  `closed_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_conv_user` (`user_id`),
  KEY `idx_conv_status` (`status`),
  KEY `idx_conv_assigned` (`assigned_to`),
  CONSTRAINT `conversations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.conversations: ~5 rows (approximately)
INSERT INTO `conversations` (`id`, `user_id`, `guest_name`, `guest_email`, `status`, `assigned_to`, `created_at`, `updated_at`, `closed_at`) VALUES
	(1, NULL, NULL, NULL, 'closed', 6, '2026-01-29 04:04:59.253', '2026-01-29 04:22:54.740', '2026-01-29 04:22:54.738'),
	(2, 6, NULL, NULL, 'closed', 6, '2026-01-29 04:20:55.140', '2026-01-29 04:37:43.076', '2026-01-29 04:37:43.074'),
	(3, 6, NULL, NULL, 'closed', 6, '2026-01-29 04:37:59.641', '2026-01-29 04:41:18.362', '2026-01-29 04:41:18.361'),
	(4, 59, 'Hoang customer', NULL, 'active', 6, '2026-01-29 04:53:05.019', '2026-01-29 09:07:03.093', NULL),
	(5, 60, 'Tống Văn Hoàng', NULL, 'waiting', NULL, '2026-01-29 11:31:33.396', '2026-01-29 11:31:33.396', NULL);

-- Dumping structure for table fashion_store.coupons
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `type` enum('percent','fixed') NOT NULL,
  `value` decimal(12,2) NOT NULL,
  `min_subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `max_discount` decimal(12,2) DEFAULT NULL,
  `start_at` datetime(3) DEFAULT NULL,
  `end_at` datetime(3) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `usage_per_user` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.coupons: ~1 rows (approximately)
INSERT INTO `coupons` (`id`, `code`, `type`, `value`, `min_subtotal`, `max_discount`, `start_at`, `end_at`, `usage_limit`, `usage_per_user`, `is_active`, `created_at`) VALUES
	(3, 'SAL20', 'percent', 20.00, 50000.00, NULL, '2026-01-23 00:00:00.000', '2026-01-29 00:00:00.000', 10, NULL, 1, '2026-01-23 11:53:32.293');

-- Dumping structure for table fashion_store.coupon_redemptions
CREATE TABLE IF NOT EXISTS `coupon_redemptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `order_id` bigint(20) unsigned NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_cr_coupon` (`coupon_id`),
  KEY `idx_cr_user` (`user_id`),
  KEY `idx_cr_order` (`order_id`),
  CONSTRAINT `coupon_redemptions_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `coupon_redemptions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `coupon_redemptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.coupon_redemptions: ~0 rows (approximately)

-- Dumping structure for table fashion_store.inventory_movements
CREATE TABLE IF NOT EXISTS `inventory_movements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `variant_id` bigint(20) unsigned NOT NULL,
  `type` enum('in','out','adjust') NOT NULL,
  `qty` int(11) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_im_variant` (`variant_id`),
  CONSTRAINT `inventory_movements_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.inventory_movements: ~5 rows (approximately)
INSERT INTO `inventory_movements` (`id`, `variant_id`, `type`, `qty`, `note`, `created_at`) VALUES
	(7, 1, 'out', 1, 'Order FS20260123-3439', '2026-01-23 13:40:29.981'),
	(8, 1, 'out', 1, 'Order FS20260123-3617', '2026-01-23 16:55:08.733'),
	(9, 7, 'out', 1, 'Order FS20260126-6980', '2026-01-26 03:54:22.041'),
	(10, 81, 'out', 20, 'Order FS20260126-2042', '2026-01-26 04:20:36.139'),
	(11, 1, 'out', 1, 'Order FS20260127-1416', '2026-01-27 08:08:39.772'),
	(12, 1, 'out', 1, 'Order FS20260129-8544', '2026-01-29 06:53:36.748');

-- Dumping structure for table fashion_store.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `type` enum('order_new','order_status','product_low_stock','product_out_of_stock','system') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` varchar(500) NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  KEY `idx_notifications_read` (`is_read`),
  KEY `idx_notifications_created` (`created_at`),
  CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.notifications: ~4 rows (approximately)
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `link`, `is_read`, `created_at`) VALUES
	(2, 6, 'order_new', 'Đơn hàng mới #ORD-123', 'Khách hàng Nguyễn Văn A vừa đặt đơn hàng trị giá 500.000đ', '/admin/orders/1', 1, '2026-01-26 03:37:09.484'),
	(3, 6, 'product_low_stock', 'Sản phẩm sắp hết hàng', 'Áo thun Basic (Size M) chỉ còn 2 sản phẩm trong kho.', '/admin/products/5', 0, '2026-01-26 03:37:09.487'),
	(4, 6, 'system', 'Hệ thống đã cập nhật', 'Phiên bản v1.2 đã được triển khai thành công.', NULL, 1, '2026-01-26 03:37:09.489'),
	(5, 6, 'order_status', 'Đơn hàng #ORD-999 đã hoàn thành', 'Giao hàng thành công cho khách hàng.', '/admin/orders/999', 1, '2026-01-26 03:37:09.490');

-- Dumping structure for table fashion_store.options
CREATE TABLE IF NOT EXISTS `options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `options_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.options: ~16 rows (approximately)
INSERT INTO `options` (`id`, `name`, `code`) VALUES
	(1, 'Màu sắc', 'color'),
	(2, 'Kích cỡ', 'size'),
	(3, 'Chất liệu', 'material'),
	(4, 'Kiểu dáng', 'fit'),
	(5, 'Họa tiết', 'pattern'),
	(6, 'Phong cách', 'style'),
	(7, 'Mùa', 'season'),
	(8, 'Dịp sử dụng', 'occasion'),
	(9, 'Chiều dài tay', 'sleeve_length'),
	(10, 'Cổ áo', 'collar'),
	(11, 'Độ dài', 'length'),
	(12, 'Eo', 'waist'),
	(13, 'Khóa', 'closure'),
	(14, 'Giới tính', 'gender'),
	(15, 'Độ tuổi', 'age_group'),
	(16, 'Thương hiệu', 'brand');

-- Dumping structure for table fashion_store.option_values
CREATE TABLE IF NOT EXISTS `option_values` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `option_id` bigint(20) unsigned NOT NULL,
  `value` varchar(100) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_option_values` (`option_id`,`value`),
  KEY `idx_ov_option` (`option_id`),
  CONSTRAINT `option_values_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.option_values: ~15 rows (approximately)
INSERT INTO `option_values` (`id`, `option_id`, `value`, `sort_order`) VALUES
	(1, 1, 'Đen', 0),
	(2, 1, 'Trắng', 0),
	(3, 1, 'Xám', 0),
	(4, 1, 'Navy', 0),
	(5, 1, 'Be', 0),
	(6, 1, 'Đỏ', 0),
	(7, 1, 'Hồng', 0),
	(8, 2, 'XS', 0),
	(9, 2, 'S', 0),
	(10, 2, 'M', 0),
	(11, 2, 'L', 0),
	(12, 2, 'XL', 0),
	(13, 2, 'XXL', 0),
	(14, 2, 'Free', 0),
	(15, 3, 'Cotton', 0);

-- Dumping structure for table fashion_store.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_code` varchar(30) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `status` enum('pending','paid','processing','shipped','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` decimal(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `customer_name` varchar(200) NOT NULL,
  `customer_phone` varchar(30) NOT NULL,
  `ship_address_line1` varchar(255) NOT NULL,
  `ship_address_line2` varchar(255) DEFAULT NULL,
  `ship_city` varchar(120) NOT NULL,
  `ship_province` varchar(120) NOT NULL,
  `ship_postal_code` varchar(20) DEFAULT NULL,
  `ship_country` varchar(80) NOT NULL DEFAULT 'VN',
  `note` varchar(500) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  `admin_note` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_code_key` (`order_code`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.orders: ~108 rows (approximately)
INSERT INTO `orders` (`id`, `order_code`, `user_id`, `status`, `subtotal`, `discount_total`, `shipping_fee`, `grand_total`, `customer_name`, `customer_phone`, `ship_address_line1`, `ship_address_line2`, `ship_city`, `ship_province`, `ship_postal_code`, `ship_country`, `note`, `created_at`, `updated_at`, `admin_note`) VALUES
	(1, 'FS20251213-0001', 2, 'paid', 277000.00, 0.00, 0.00, 282000.00, 'Khánh', '0900000002', '12 Nguyễn Trãi', NULL, 'Quận 1', 'TP.HCM', NULL, 'VN', NULL, '2026-01-22 21:09:18.630', NULL, NULL),
	(2, 'FS20251213-0002', 3, 'processing', 109000.00, 0.00, 0.00, 134000.00, 'Minh', '0900000003', '45 Lê Lợi', NULL, 'Quận 1', 'TP.HCM', NULL, 'VN', NULL, '2026-01-22 21:09:18.630', NULL, NULL),
	(3, 'FS20251213-0003', NULL, 'pending', 59000.00, 0.00, 0.00, 79000.00, 'Guest User', '0900000999', '99 Pasteur', NULL, 'Quận 3', 'TP.HCM', NULL, 'VN', NULL, '2026-01-22 21:09:18.630', NULL, NULL),
	(4, 'FS20251201-0101', 2, 'paid', 189000.00, 0.00, 0.00, 204000.00, 'Khánh', '0900000002', '12 Nguyễn Trãi', NULL, 'Quận 1', 'TP.HCM', NULL, 'VN', NULL, '2026-01-22 21:09:18.630', NULL, NULL),
	(5, 'FS20251202-0102', 3, 'completed', 279000.00, 0.00, 0.00, 304000.00, 'Minh', '0900000003', '45 Lê Lợi', NULL, 'Quận 1', 'TP.HCM', NULL, 'VN', NULL, '2026-01-22 21:09:18.630', NULL, NULL),
	(19, 'FS20260122-0001', 5, 'processing', 350000.00, 0.00, 0.00, 370000.00, 'Tuấn Dev', '0900000005', '100 CMT8', NULL, 'Quận 3', 'TP.HCM', NULL, 'VN', NULL, '2026-01-22 21:09:18.630', '2026-01-24 03:54:30.178', NULL),
	(20, 'FS20260122-0002', 4, 'shipped', 600000.00, 0.00, 0.00, 620000.00, 'Linh', '0900000004', '20 Võ Văn Tần', NULL, 'Quận 3', 'TP.HCM', NULL, 'VN', NULL, '2026-01-22 21:09:18.630', NULL, NULL),
	(21, 'FS20260121-0100', 23, 'paid', 1040000.00, 0.00, 0.00, 1040000.00, 'Phan Long', '0963478517', '155 Lê Lợi', NULL, 'Quận 7', 'TP.HCM', NULL, 'VN', NULL, '2026-01-20 20:09:36.125', '2026-01-23 05:03:37.471', NULL),
	(22, 'FS20251130-0101', 36, 'shipped', 335000.00, 0.00, 30000.00, 365000.00, 'Phạm Long', '0763892863', '182 Nguyễn Huệ', NULL, 'Quận 1', 'Nha Trang', NULL, 'VN', NULL, '2025-11-29 23:01:41.713', '2026-01-23 05:03:37.476', NULL),
	(23, 'FS20260122-0102', 3, 'processing', 313000.00, 0.00, 30000.00, 343000.00, 'Minh', '0900000003', '168 Pasteur', NULL, 'Tân Bình', 'Hải Phòng', NULL, 'VN', NULL, '2026-01-22 15:32:27.510', '2026-01-23 05:03:37.480', NULL),
	(24, 'FS20260123-0103', 38, 'paid', 1348000.00, 0.00, 0.00, 1348000.00, 'Trần Hoàng', '0944796027', '9 Điện Biên Phủ', NULL, 'Phú Nhuận', 'Huế', NULL, 'VN', NULL, '2026-01-22 20:42:28.939', '2026-01-23 05:03:37.483', NULL),
	(25, 'FS20260120-0104', 15, 'shipped', 2063000.00, 0.00, 0.00, 2063000.00, 'Ngô Nam', '0775220673', '133 Cách Mạng Tháng 8', NULL, 'Cầu Giấy', 'Hà Nội', NULL, 'VN', NULL, '2026-01-19 20:16:27.503', '2026-01-23 05:03:37.485', NULL),
	(26, 'FS20260120-0105', 26, 'pending', 2501000.00, 0.00, 0.00, 2501000.00, 'Hoàng Hà', '0797051966', '134 Pasteur', NULL, 'Gò Vấp', 'Cần Thơ', NULL, 'VN', NULL, '2026-01-20 15:59:56.867', '2026-01-23 05:03:37.490', NULL),
	(27, 'FS20260120-0106', 12, 'pending', 2361000.00, 0.00, 0.00, 2361000.00, 'Bùi Hải', '0792194879', '243 Nguyễn Huệ', NULL, 'Tân Bình', 'Vũng Tàu', NULL, 'VN', NULL, '2026-01-19 23:46:42.114', '2026-01-23 05:03:37.493', NULL),
	(28, 'FS20260119-0107', 51, 'processing', 1439000.00, 0.00, 0.00, 1439000.00, 'Đỗ Lan', '0843386466', '64 Trần Hưng Đạo', NULL, 'Phú Nhuận', 'Đà Nẵng', NULL, 'VN', NULL, '2026-01-19 15:34:27.005', '2026-01-23 05:03:37.495', NULL),
	(29, 'FS20251102-0108', 30, 'completed', 1124000.00, 0.00, 0.00, 1124000.00, 'Phạm Mai', '0948089368', '424 Cách Mạng Tháng 8', NULL, 'Đống Đa', 'Hải Phòng', NULL, 'VN', NULL, '2025-11-01 19:58:43.590', '2026-01-23 05:03:37.497', NULL),
	(30, 'FS20260111-0109', 25, 'completed', 74000.00, 0.00, 30000.00, 104000.00, 'Hồ Hoàng', '0967725098', '342 Nam Kỳ Khởi Nghĩa', NULL, 'Bình Thạnh', 'Vũng Tàu', NULL, 'VN', NULL, '2026-01-11 12:57:24.114', '2026-01-23 05:03:37.500', NULL),
	(31, 'FS20251202-0110', 10, 'shipped', 838000.00, 0.00, 0.00, 838000.00, 'Phạm Thảo', '0856789930', '138 Nguyễn Huệ', NULL, 'Phú Nhuận', 'Đà Nẵng', NULL, 'VN', NULL, '2025-12-01 17:40:02.465', '2026-01-23 05:03:37.502', NULL),
	(32, 'FS20251219-0111', 49, 'completed', 350000.00, 0.00, 30000.00, 380000.00, 'Trần Long', '0838495721', '368 Cách Mạng Tháng 8', NULL, 'Quận 1', 'Đà Nẵng', NULL, 'VN', NULL, '2025-12-19 08:18:06.629', '2026-01-23 05:03:37.503', NULL),
	(33, 'FS20260101-0112', 45, 'shipped', 846000.00, 0.00, 0.00, 846000.00, 'Huỳnh Linh', '0854910210', '128 Võ Văn Tần', NULL, 'Bình Thạnh', 'Buôn Ma Thuột', NULL, 'VN', NULL, '2026-01-01 05:45:32.491', '2026-01-23 05:03:37.505', NULL),
	(34, 'FS20251106-0113', 41, 'paid', 2049000.00, 0.00, 0.00, 2049000.00, 'Đặng Tuấn', '0987425930', '422 Nam Kỳ Khởi Nghĩa', NULL, 'Thủ Đức', 'Vũng Tàu', NULL, 'VN', NULL, '2025-11-06 03:05:19.948', '2026-01-23 05:03:37.506', NULL),
	(35, 'FS20251103-0114', 23, 'processing', 362000.00, 0.00, 30000.00, 392000.00, 'Phan Long', '0963478517', '155 Lê Lợi', NULL, 'Quận 7', 'TP.HCM', NULL, 'VN', NULL, '2025-11-03 05:29:31.247', '2026-01-23 05:03:37.508', NULL),
	(36, 'FS20260116-0115', 44, 'paid', 136000.00, 0.00, 30000.00, 166000.00, 'Trần Thu', '0783304050', '229 Võ Văn Tần', NULL, 'Gò Vấp', 'Huế', NULL, 'VN', NULL, '2026-01-16 11:06:18.371', '2026-01-23 05:03:37.509', NULL),
	(37, 'FS20260112-0116', 27, 'pending', 1660000.00, 0.00, 0.00, 1660000.00, 'Võ Lan', '0848952278', '272 Võ Văn Tần', NULL, 'Thủ Đức', 'Vũng Tàu', NULL, 'VN', NULL, '2026-01-12 01:53:14.731', '2026-01-23 05:03:37.511', NULL),
	(38, 'FS20251130-0117', 15, 'pending', 1223000.00, 0.00, 0.00, 1223000.00, 'Ngô Nam', '0775220673', '133 Cách Mạng Tháng 8', NULL, 'Cầu Giấy', 'Hà Nội', NULL, 'VN', NULL, '2025-11-30 00:49:59.970', '2026-01-23 05:03:37.512', NULL),
	(39, 'FS20260107-0118', 20, 'completed', 1148000.00, 0.00, 0.00, 1148000.00, 'Dương Minh', '0841585117', '146 Lý Tự Trọng', NULL, 'Cầu Giấy', 'TP.HCM', NULL, 'VN', NULL, '2026-01-07 07:49:27.621', '2026-01-23 05:03:37.514', NULL),
	(40, 'FS20260101-0119', 23, 'processing', 1596000.00, 0.00, 0.00, 1596000.00, 'Phan Long', '0963478517', '155 Lê Lợi', NULL, 'Quận 7', 'TP.HCM', NULL, 'VN', NULL, '2025-12-31 21:55:38.642', '2026-01-23 05:03:37.516', NULL),
	(41, 'FS20260109-0120', 25, 'paid', 2477000.00, 0.00, 0.00, 2477000.00, 'Hồ Hoàng', '0967725098', '342 Nam Kỳ Khởi Nghĩa', NULL, 'Bình Thạnh', 'Vũng Tàu', NULL, 'VN', NULL, '2026-01-09 05:22:05.076', '2026-01-23 05:03:37.519', NULL),
	(42, 'FS20251125-0121', 48, 'shipped', 766000.00, 0.00, 0.00, 766000.00, 'Ngô Tú', '0815280548', '495 Võ Văn Tần', NULL, 'Quận 3', 'TP.HCM', NULL, 'VN', NULL, '2025-11-25 16:05:26.711', '2026-01-23 05:03:37.521', NULL),
	(43, 'FS20251127-0122', 42, 'processing', 329000.00, 0.00, 30000.00, 359000.00, 'Võ Minh', '0769918268', '299 Nguyễn Huệ', NULL, 'Thủ Đức', 'Cần Thơ', NULL, 'VN', NULL, '2025-11-27 14:33:10.734', '2026-01-23 05:03:37.524', NULL),
	(44, 'FS20251211-0123', 23, 'shipped', 2794000.00, 0.00, 0.00, 2794000.00, 'Phan Long', '0963478517', '155 Lê Lợi', NULL, 'Quận 7', 'TP.HCM', NULL, 'VN', NULL, '2025-12-11 15:27:42.975', '2026-01-23 05:03:37.526', NULL),
	(45, 'FS20251116-0124', 9, 'processing', 587000.00, 0.00, 0.00, 587000.00, 'Lê Lan', '0984518917', '489 Điện Biên Phủ', NULL, 'Đống Đa', 'TP.HCM', NULL, 'VN', NULL, '2025-11-16 16:17:16.560', '2026-01-23 05:03:37.530', NULL),
	(46, 'FS20251101-0125', 5, 'cancelled', 1797000.00, 0.00, 0.00, 1797000.00, 'Tuấn Dev', '0900000005', '209 Lê Lợi', NULL, 'Bình Thạnh', 'Đà Nẵng', NULL, 'VN', NULL, '2025-11-01 04:48:34.895', '2026-01-23 05:03:37.532', NULL),
	(47, 'FS20251109-0126', 21, 'processing', 607000.00, 0.00, 0.00, 607000.00, 'Bùi Hà', '0986827054', '242 Võ Văn Tần', NULL, 'Phú Nhuận', 'Cần Thơ', NULL, 'VN', NULL, '2025-11-08 18:58:41.234', '2026-01-23 05:03:37.534', NULL),
	(48, 'FS20251227-0127', 21, 'shipped', 872000.00, 0.00, 0.00, 872000.00, 'Bùi Hà', '0986827054', '242 Võ Văn Tần', NULL, 'Phú Nhuận', 'Cần Thơ', NULL, 'VN', NULL, '2025-12-27 00:42:04.548', '2026-01-23 05:03:37.537', NULL),
	(49, 'FS20260117-0128', 45, 'cancelled', 161000.00, 0.00, 30000.00, 191000.00, 'Huỳnh Linh', '0854910210', '128 Võ Văn Tần', NULL, 'Bình Thạnh', 'Buôn Ma Thuột', NULL, 'VN', NULL, '2026-01-17 01:12:49.387', '2026-01-23 05:03:37.539', NULL),
	(50, 'FS20251120-0129', 50, 'shipped', 2685000.00, 0.00, 0.00, 2685000.00, 'Hồ Tuấn', '0963335814', '280 Lý Tự Trọng', NULL, 'Thủ Đức', 'Buôn Ma Thuột', NULL, 'VN', NULL, '2025-11-20 14:50:41.089', '2026-01-23 05:03:37.542', NULL),
	(51, 'FS20251127-0130', 41, 'pending', 2043000.00, 0.00, 0.00, 2043000.00, 'Đặng Tuấn', '0987425930', '422 Nam Kỳ Khởi Nghĩa', NULL, 'Thủ Đức', 'Vũng Tàu', NULL, 'VN', NULL, '2025-11-27 10:52:36.958', '2026-01-23 05:03:37.544', NULL),
	(52, 'FS20251112-0131', 45, 'pending', 610000.00, 0.00, 0.00, 610000.00, 'Huỳnh Linh', '0854910210', '128 Võ Văn Tần', NULL, 'Bình Thạnh', 'Buôn Ma Thuột', NULL, 'VN', NULL, '2025-11-11 18:15:29.296', '2026-01-23 05:03:37.547', NULL),
	(53, 'FS20251119-0132', 49, 'shipped', 1778000.00, 0.00, 0.00, 1778000.00, 'Trần Long', '0838495721', '368 Cách Mạng Tháng 8', NULL, 'Quận 1', 'Đà Nẵng', NULL, 'VN', NULL, '2025-11-19 08:15:46.375', '2026-01-23 05:03:37.549', NULL),
	(54, 'FS20251123-0133', 37, 'shipped', 1676000.00, 0.00, 0.00, 1676000.00, 'Đặng Dũng', '0975199467', '13 Pasteur', NULL, 'Quận 3', 'Hà Nội', NULL, 'VN', NULL, '2025-11-23 10:32:03.498', '2026-01-23 05:03:37.552', NULL),
	(55, 'FS20251215-0134', 18, 'processing', 1670000.00, 0.00, 0.00, 1670000.00, 'Dương Mai', '0837116607', '356 Hai Bà Trưng', NULL, 'Quận 7', 'Cần Thơ', NULL, 'VN', NULL, '2025-12-14 18:53:24.827', '2026-01-23 05:03:37.554', NULL),
	(56, 'FS20260105-0135', 5, 'processing', 483000.00, 0.00, 30000.00, 513000.00, 'Tuấn Dev', '0900000005', '378 Lý Tự Trọng', NULL, 'Phú Nhuận', 'Hà Nội', NULL, 'VN', NULL, '2026-01-05 15:08:48.105', '2026-01-23 05:03:37.557', NULL),
	(57, 'FS20260108-0136', 27, 'processing', 1910000.00, 0.00, 0.00, 1910000.00, 'Võ Lan', '0848952278', '272 Võ Văn Tần', NULL, 'Thủ Đức', 'Vũng Tàu', NULL, 'VN', NULL, '2026-01-08 14:57:49.507', '2026-01-23 05:03:37.559', NULL),
	(58, 'FS20251207-0137', 11, 'cancelled', 1834000.00, 0.00, 0.00, 1834000.00, 'Dương Minh', '0903892767', '315 Nam Kỳ Khởi Nghĩa', NULL, 'Quận 1', 'Buôn Ma Thuột', NULL, 'VN', NULL, '2025-12-07 13:58:19.004', '2026-01-23 05:03:37.561', NULL),
	(59, 'FS20260106-0138', 46, 'paid', 222000.00, 0.00, 30000.00, 252000.00, 'Vũ Hương', '0988275776', '135 Trần Hưng Đạo', NULL, 'Bình Thạnh', 'Biên Hòa', NULL, 'VN', NULL, '2026-01-06 16:11:56.107', '2026-01-23 05:03:37.564', NULL),
	(60, 'FS20251107-0139', 26, 'shipped', 540000.00, 0.00, 0.00, 540000.00, 'Hoàng Hà', '0797051966', '134 Pasteur', NULL, 'Gò Vấp', 'Cần Thơ', NULL, 'VN', NULL, '2025-11-07 11:41:33.571', '2026-01-23 05:03:37.567', NULL),
	(61, 'FS20251216-0140', 44, 'pending', 1613000.00, 0.00, 0.00, 1613000.00, 'Trần Thu', '0783304050', '229 Võ Văn Tần', NULL, 'Gò Vấp', 'Huế', NULL, 'VN', NULL, '2025-12-16 09:03:30.184', '2026-01-23 05:03:37.569', NULL),
	(62, 'FS20251109-0141', 13, 'shipped', 2105000.00, 0.00, 0.00, 2105000.00, 'Hồ Đức', '0846547618', '433 Pasteur', NULL, 'Bình Thạnh', 'Vũng Tàu', NULL, 'VN', NULL, '2025-11-08 23:46:15.938', '2026-01-23 05:03:37.571', NULL),
	(63, 'FS20251231-0142', 24, 'processing', 1217000.00, 0.00, 0.00, 1217000.00, 'Trần Tú', '0847345923', '275 Nguyễn Huệ', NULL, 'Phú Nhuận', 'Cần Thơ', NULL, 'VN', NULL, '2025-12-30 19:44:29.082', '2026-01-23 05:03:37.573', NULL),
	(64, 'FS20260101-0143', 17, 'completed', 62000.00, 0.00, 30000.00, 92000.00, 'Huỳnh Hoàng', '0833244147', '313 Nam Kỳ Khởi Nghĩa', NULL, 'Thủ Đức', 'Vũng Tàu', NULL, 'VN', NULL, '2026-01-01 00:50:12.227', '2026-01-23 05:03:37.576', NULL),
	(65, 'FS20251209-0144', 4, 'cancelled', 2336000.00, 0.00, 0.00, 2336000.00, 'Linh', '0900000004', '269 Pasteur', NULL, 'Quận 1', 'Buôn Ma Thuột', NULL, 'VN', NULL, '2025-12-09 06:30:04.619', '2026-01-23 05:03:37.577', NULL),
	(66, 'FS20251111-0145', 30, 'shipped', 257000.00, 0.00, 30000.00, 287000.00, 'Phạm Mai', '0948089368', '424 Cách Mạng Tháng 8', NULL, 'Đống Đa', 'Hải Phòng', NULL, 'VN', NULL, '2025-11-11 08:59:21.223', '2026-01-23 05:03:37.579', NULL),
	(67, 'FS20251125-0146', 4, 'completed', 2592000.00, 0.00, 0.00, 2592000.00, 'Linh', '0900000004', '235 Lý Tự Trọng', NULL, 'Đống Đa', 'Buôn Ma Thuột', NULL, 'VN', NULL, '2025-11-25 15:22:18.191', '2026-01-23 05:03:37.581', NULL),
	(68, 'FS20251104-0147', 13, 'cancelled', 634000.00, 0.00, 0.00, 634000.00, 'Hồ Đức', '0846547618', '433 Pasteur', NULL, 'Bình Thạnh', 'Vũng Tàu', NULL, 'VN', NULL, '2025-11-04 07:20:36.881', '2026-01-23 05:03:37.584', NULL),
	(69, 'FS20251202-0148', 37, 'cancelled', 494000.00, 0.00, 30000.00, 524000.00, 'Đặng Dũng', '0975199467', '13 Pasteur', NULL, 'Quận 3', 'Hà Nội', NULL, 'VN', NULL, '2025-12-02 14:29:23.131', '2026-01-23 05:03:37.586', NULL),
	(70, 'FS20251109-0149', 56, 'cancelled', 1364000.00, 0.00, 0.00, 1364000.00, 'Võ Hà', '0852308122', '299 Pasteur', NULL, 'Phú Nhuận', 'Huế', NULL, 'VN', NULL, '2025-11-09 05:48:25.785', '2026-01-23 05:03:37.588', NULL),
	(71, 'FS20251205-0150', 30, 'processing', 1953000.00, 0.00, 0.00, 1953000.00, 'Phạm Mai', '0948089368', '424 Cách Mạng Tháng 8', NULL, 'Đống Đa', 'Hải Phòng', NULL, 'VN', NULL, '2025-12-05 11:23:07.534', '2026-01-23 05:03:37.590', NULL),
	(72, 'FS20260102-0151', 32, 'pending', 2105000.00, 0.00, 0.00, 2105000.00, 'Lê Minh', '0775762675', '209 Cách Mạng Tháng 8', NULL, 'Phú Nhuận', 'Huế', NULL, 'VN', NULL, '2026-01-02 00:31:15.970', '2026-01-23 05:03:37.592', NULL),
	(73, 'FS20260115-0152', 43, 'paid', 1801000.00, 0.00, 0.00, 1801000.00, 'Huỳnh Hải', '0944968231', '280 Lê Lợi', NULL, 'Đống Đa', 'Vũng Tàu', NULL, 'VN', NULL, '2026-01-14 19:57:32.804', '2026-01-23 05:03:37.594', NULL),
	(74, 'FS20251103-0153', 28, 'completed', 779000.00, 0.00, 0.00, 779000.00, 'Võ Nam', '0976802340', '246 Điện Biên Phủ', NULL, 'Phú Nhuận', 'Hải Phòng', NULL, 'VN', NULL, '2025-11-02 19:19:47.465', '2026-01-23 05:03:37.597', NULL),
	(75, 'FS20251116-0154', 18, 'processing', 2898000.00, 0.00, 0.00, 2898000.00, 'Dương Mai', '0837116607', '356 Hai Bà Trưng', NULL, 'Quận 7', 'Cần Thơ', NULL, 'VN', NULL, '2025-11-16 10:21:49.987', '2026-01-23 05:03:37.600', NULL),
	(76, 'FS20251220-0155', 30, 'pending', 1028000.00, 0.00, 0.00, 1028000.00, 'Phạm Mai', '0948089368', '424 Cách Mạng Tháng 8', NULL, 'Đống Đa', 'Hải Phòng', NULL, 'VN', NULL, '2025-12-20 08:16:35.489', '2026-01-23 05:03:37.602', NULL),
	(77, 'FS20251228-0156', 43, 'processing', 3093000.00, 0.00, 0.00, 3093000.00, 'Huỳnh Hải', '0944968231', '280 Lê Lợi', NULL, 'Đống Đa', 'Vũng Tàu', NULL, 'VN', NULL, '2025-12-28 11:07:16.535', '2026-01-23 05:03:37.605', NULL),
	(78, 'FS20260107-0157', 14, 'pending', 222000.00, 0.00, 30000.00, 252000.00, 'Lê Phương', '0963648417', '286 Lê Lợi', NULL, 'Quận 3', 'Huế', NULL, 'VN', NULL, '2026-01-06 23:27:43.927', '2026-01-23 05:03:37.609', NULL),
	(79, 'FS20251228-0158', 15, 'paid', 329000.00, 0.00, 30000.00, 359000.00, 'Ngô Nam', '0775220673', '133 Cách Mạng Tháng 8', NULL, 'Cầu Giấy', 'Hà Nội', NULL, 'VN', NULL, '2025-12-28 03:17:49.919', '2026-01-23 05:03:37.612', NULL),
	(80, 'FS20251113-0159', 29, 'processing', 112000.00, 0.00, 30000.00, 142000.00, 'Phạm Dũng', '0836881070', '326 Cách Mạng Tháng 8', NULL, 'Bình Thạnh', 'Đà Nẵng', NULL, 'VN', NULL, '2025-11-13 09:34:03.610', '2026-01-23 05:03:37.614', NULL),
	(81, 'FS20251108-0160', 38, 'shipped', 369000.00, 0.00, 30000.00, 399000.00, 'Trần Hoàng', '0944796027', '9 Điện Biên Phủ', NULL, 'Phú Nhuận', 'Huế', NULL, 'VN', NULL, '2025-11-08 15:58:00.629', '2026-01-23 05:03:37.615', NULL),
	(82, 'FS20251202-0161', 38, 'cancelled', 1160000.00, 0.00, 0.00, 1160000.00, 'Trần Hoàng', '0944796027', '9 Điện Biên Phủ', NULL, 'Phú Nhuận', 'Huế', NULL, 'VN', NULL, '2025-12-02 04:42:44.769', '2026-01-23 05:03:37.617', NULL),
	(83, 'FS20251225-0162', 28, 'cancelled', 657000.00, 0.00, 0.00, 657000.00, 'Võ Nam', '0976802340', '246 Điện Biên Phủ', NULL, 'Phú Nhuận', 'Hải Phòng', NULL, 'VN', NULL, '2025-12-25 05:58:31.575', '2026-01-23 05:03:37.619', NULL),
	(84, 'FS20260102-0163', 4, 'paid', 947000.00, 0.00, 0.00, 947000.00, 'Linh', '0900000004', '93 Lý Tự Trọng', NULL, 'Phú Nhuận', 'TP.HCM', NULL, 'VN', NULL, '2026-01-02 02:41:05.883', '2026-01-23 05:03:37.621', NULL),
	(85, 'FS20260122-0164', 19, 'shipped', 1291000.00, 0.00, 0.00, 1291000.00, 'Bùi Dũng', '0949822507', '302 Pasteur', NULL, 'Phú Nhuận', 'TP.HCM', NULL, 'VN', NULL, '2026-01-21 18:07:39.540', '2026-01-23 05:03:37.623', NULL),
	(86, 'FS20260118-0165', 25, 'cancelled', 657000.00, 0.00, 0.00, 657000.00, 'Hồ Hoàng', '0967725098', '342 Nam Kỳ Khởi Nghĩa', NULL, 'Bình Thạnh', 'Vũng Tàu', NULL, 'VN', NULL, '2026-01-18 04:02:03.616', '2026-01-23 05:03:37.624', NULL),
	(87, 'FS20251207-0166', 32, 'pending', 1370000.00, 0.00, 0.00, 1370000.00, 'Lê Minh', '0775762675', '209 Cách Mạng Tháng 8', NULL, 'Phú Nhuận', 'Huế', NULL, 'VN', NULL, '2025-12-06 20:45:26.392', '2026-01-23 05:03:37.626', NULL),
	(88, 'FS20260122-0167', 38, 'processing', 2850000.00, 0.00, 0.00, 2850000.00, 'Trần Hoàng', '0944796027', '9 Điện Biên Phủ', NULL, 'Phú Nhuận', 'Huế', NULL, 'VN', NULL, '2026-01-22 11:57:41.084', '2026-01-23 05:03:37.627', NULL),
	(89, 'FS20251110-0168', 37, 'cancelled', 1142000.00, 0.00, 0.00, 1142000.00, 'Đặng Dũng', '0975199467', '13 Pasteur', NULL, 'Quận 3', 'Hà Nội', NULL, 'VN', NULL, '2025-11-09 17:46:40.886', '2026-01-23 05:03:37.629', NULL),
	(90, 'FS20251114-0169', 18, 'processing', 845000.00, 0.00, 0.00, 845000.00, 'Dương Mai', '0837116607', '356 Hai Bà Trưng', NULL, 'Quận 7', 'Cần Thơ', NULL, 'VN', NULL, '2025-11-13 18:32:33.928', '2026-01-23 05:03:37.631', NULL),
	(91, 'FS20260117-0170', 44, 'shipped', 1330000.00, 0.00, 0.00, 1330000.00, 'Trần Thu', '0783304050', '229 Võ Văn Tần', NULL, 'Gò Vấp', 'Huế', NULL, 'VN', NULL, '2026-01-17 02:52:36.704', '2026-01-23 05:03:37.632', NULL),
	(92, 'FS20251204-0171', 46, 'completed', 2063000.00, 0.00, 0.00, 2063000.00, 'Vũ Hương', '0988275776', '135 Trần Hưng Đạo', NULL, 'Bình Thạnh', 'Biên Hòa', NULL, 'VN', NULL, '2025-12-04 10:27:39.238', '2026-01-23 05:03:37.633', NULL),
	(93, 'FS20251102-0172', 49, 'paid', 3152000.00, 0.00, 0.00, 3152000.00, 'Trần Long', '0838495721', '368 Cách Mạng Tháng 8', NULL, 'Quận 1', 'Đà Nẵng', NULL, 'VN', NULL, '2025-11-02 05:55:44.703', '2026-01-23 05:03:37.635', NULL),
	(94, 'FS20251227-0173', 22, 'pending', 1971000.00, 0.00, 0.00, 1971000.00, 'Ngô Hải', '0939580779', '309 Điện Biên Phủ', NULL, 'Thủ Đức', 'Vũng Tàu', NULL, 'VN', NULL, '2025-12-27 06:15:11.120', '2026-01-23 05:03:37.637', NULL),
	(95, 'FS20251204-0174', 37, 'pending', 3445000.00, 0.00, 0.00, 3445000.00, 'Đặng Dũng', '0975199467', '13 Pasteur', NULL, 'Quận 3', 'Hà Nội', NULL, 'VN', NULL, '2025-12-04 15:24:17.567', '2026-01-23 05:03:37.640', NULL),
	(96, 'FS20251217-0175', 56, 'processing', 680000.00, 0.00, 0.00, 680000.00, 'Võ Hà', '0852308122', '299 Pasteur', NULL, 'Phú Nhuận', 'Huế', NULL, 'VN', NULL, '2025-12-16 21:33:10.871', '2026-01-23 05:03:37.643', NULL),
	(97, 'FS20251202-0176', 20, 'cancelled', 2405000.00, 0.00, 0.00, 2405000.00, 'Dương Minh', '0841585117', '146 Lý Tự Trọng', NULL, 'Cầu Giấy', 'TP.HCM', NULL, 'VN', NULL, '2025-12-01 21:24:17.363', '2026-01-23 05:03:37.646', NULL),
	(98, 'FS20251119-0177', 53, 'cancelled', 2061000.00, 0.00, 0.00, 2061000.00, 'Phạm Nam', '0816458478', '340 Cách Mạng Tháng 8', NULL, 'Quận 7', 'Huế', NULL, 'VN', NULL, '2025-11-19 11:51:41.944', '2026-01-23 05:03:37.648', NULL),
	(99, 'FS20260113-0178', 10, 'shipped', 2002000.00, 0.00, 0.00, 2002000.00, 'Phạm Thảo', '0856789930', '138 Nguyễn Huệ', NULL, 'Phú Nhuận', 'Đà Nẵng', NULL, 'VN', NULL, '2026-01-12 19:10:17.705', '2026-01-23 05:03:37.650', NULL),
	(100, 'FS20251229-0179', 9, 'pending', 224000.00, 0.00, 30000.00, 254000.00, 'Lê Lan', '0984518917', '489 Điện Biên Phủ', NULL, 'Đống Đa', 'TP.HCM', NULL, 'VN', NULL, '2025-12-29 04:18:12.326', '2026-01-23 05:03:37.652', NULL),
	(101, 'FS20251121-0180', 37, 'shipped', 663000.00, 0.00, 0.00, 663000.00, 'Đặng Dũng', '0975199467', '13 Pasteur', NULL, 'Quận 3', 'Hà Nội', NULL, 'VN', NULL, '2025-11-21 01:59:03.365', '2026-01-23 05:03:37.654', NULL),
	(102, 'FS20251228-0181', 26, 'completed', 2726000.00, 0.00, 0.00, 2726000.00, 'Hoàng Hà', '0797051966', '134 Pasteur', NULL, 'Gò Vấp', 'Cần Thơ', NULL, 'VN', NULL, '2025-12-28 14:23:57.900', '2026-01-23 05:03:37.657', NULL),
	(103, 'FS20251106-0182', 21, 'cancelled', 833000.00, 0.00, 0.00, 833000.00, 'Bùi Hà', '0986827054', '242 Võ Văn Tần', NULL, 'Phú Nhuận', 'Cần Thơ', NULL, 'VN', NULL, '2025-11-05 21:33:14.958', '2026-01-23 05:03:37.659', NULL),
	(104, 'FS20260119-0183', 15, 'paid', 856000.00, 0.00, 0.00, 856000.00, 'Ngô Nam', '0775220673', '133 Cách Mạng Tháng 8', NULL, 'Cầu Giấy', 'Hà Nội', NULL, 'VN', NULL, '2026-01-18 18:12:45.410', '2026-01-23 05:03:37.661', NULL),
	(105, 'FS20251203-0184', 3, 'completed', 1584000.00, 0.00, 0.00, 1584000.00, 'Minh', '0900000003', '397 Nguyễn Huệ', NULL, 'Thủ Đức', 'Biên Hòa', NULL, 'VN', NULL, '2025-12-02 19:00:57.801', '2026-01-23 05:03:37.662', NULL),
	(106, 'FS20260103-0185', 16, 'shipped', 1300000.00, 0.00, 0.00, 1300000.00, 'Đặng Hương', '0966811179', '49 Pasteur', NULL, 'Gò Vấp', 'Đà Nẵng', NULL, 'VN', NULL, '2026-01-02 23:52:07.851', '2026-01-23 05:03:37.664', NULL),
	(107, 'FS20251124-0186', 29, 'paid', 2094000.00, 0.00, 0.00, 2094000.00, 'Phạm Dũng', '0836881070', '326 Cách Mạng Tháng 8', NULL, 'Bình Thạnh', 'Đà Nẵng', NULL, 'VN', NULL, '2025-11-24 09:03:15.672', '2026-01-23 05:03:37.665', NULL),
	(108, 'FS20251215-0187', 11, 'completed', 2055000.00, 0.00, 0.00, 2055000.00, 'Dương Minh', '0903892767', '315 Nam Kỳ Khởi Nghĩa', NULL, 'Quận 1', 'Buôn Ma Thuột', NULL, 'VN', NULL, '2025-12-15 01:49:38.798', '2026-01-23 05:03:37.667', NULL),
	(109, 'FS20251208-0188', 31, 'pending', 1698000.00, 0.00, 0.00, 1698000.00, 'Phan Hùng', '0818206559', '24 Điện Biên Phủ', NULL, 'Quận 3', 'Nha Trang', NULL, 'VN', NULL, '2025-12-07 23:25:36.741', '2026-01-23 05:03:37.669', NULL),
	(110, 'FS20251116-0189', 22, 'paid', 367000.00, 0.00, 30000.00, 397000.00, 'Ngô Hải', '0939580779', '309 Điện Biên Phủ', NULL, 'Thủ Đức', 'Vũng Tàu', NULL, 'VN', NULL, '2025-11-16 15:09:35.184', '2026-01-23 05:03:37.670', NULL),
	(111, 'FS20251116-0190', 33, 'completed', 936000.00, 0.00, 0.00, 936000.00, 'Huỳnh Tú', '0974138040', '342 Lý Tự Trọng', NULL, 'Phú Nhuận', 'Vũng Tàu', NULL, 'VN', NULL, '2025-11-16 15:43:54.028', '2026-01-23 05:03:37.671', NULL),
	(112, 'FS20251214-0191', 50, 'processing', 1313000.00, 0.00, 0.00, 1313000.00, 'Hồ Tuấn', '0963335814', '280 Lý Tự Trọng', NULL, 'Thủ Đức', 'Buôn Ma Thuột', NULL, 'VN', NULL, '2025-12-13 17:57:33.396', '2026-01-23 05:03:37.674', NULL),
	(113, 'FS20260104-0192', 27, 'pending', 837000.00, 0.00, 0.00, 837000.00, 'Võ Lan', '0848952278', '272 Võ Văn Tần', NULL, 'Thủ Đức', 'Vũng Tàu', NULL, 'VN', NULL, '2026-01-03 19:55:58.690', '2026-01-23 05:03:37.676', NULL),
	(114, 'FS20251220-0193', 14, 'shipped', 1295000.00, 0.00, 0.00, 1295000.00, 'Lê Phương', '0963648417', '286 Lê Lợi', NULL, 'Quận 3', 'Huế', NULL, 'VN', NULL, '2025-12-19 23:33:54.721', '2026-01-23 05:03:37.677', NULL),
	(115, 'FS20251103-0194', 2, 'paid', 987000.00, 0.00, 0.00, 987000.00, 'Khánh', '0900000002', '168 Cách Mạng Tháng 8', NULL, 'Đống Đa', 'Huế', NULL, 'VN', NULL, '2025-11-02 21:47:27.616', '2026-01-23 05:03:37.680', NULL),
	(116, 'FS20260113-0195', 42, 'completed', 2923000.00, 0.00, 0.00, 2923000.00, 'Võ Minh', '0769918268', '299 Nguyễn Huệ', NULL, 'Thủ Đức', 'Cần Thơ', NULL, 'VN', NULL, '2026-01-13 12:37:41.905', '2026-01-23 05:03:37.683', NULL),
	(117, 'FS20251109-0196', 24, 'cancelled', 211000.00, 0.00, 30000.00, 241000.00, 'Trần Tú', '0847345923', '275 Nguyễn Huệ', NULL, 'Phú Nhuận', 'Cần Thơ', NULL, 'VN', NULL, '2025-11-09 13:11:30.463', '2026-01-23 05:03:37.686', NULL),
	(118, 'FS20260123-0197', 29, 'shipped', 2871000.00, 0.00, 0.00, 2871000.00, 'Phạm Dũng', '0836881070', '326 Cách Mạng Tháng 8', NULL, 'Bình Thạnh', 'Đà Nẵng', NULL, 'VN', NULL, '2026-01-22 22:06:11.216', '2026-01-23 07:48:58.907', NULL),
	(119, 'FS20251130-0198', 19, 'cancelled', 1672000.00, 0.00, 0.00, 1672000.00, 'Bùi Dũng', '0949822507', '302 Pasteur', NULL, 'Phú Nhuận', 'TP.HCM', NULL, 'VN', NULL, '2025-11-30 00:18:04.914', '2026-01-23 05:03:37.689', NULL),
	(120, 'FS20251107-0199', 9, 'processing', 657000.00, 0.00, 0.00, 657000.00, 'Lê Lan', '0984518917', '489 Điện Biên Phủ', NULL, 'Đống Đa', 'TP.HCM', NULL, 'VN', NULL, '2025-11-07 13:21:57.110', '2026-01-23 05:03:37.691', NULL),
	(122, 'FS20260123-3617', 6, 'pending', 99000.00, 0.00, 35000.00, 134000.00, 'Hoang ADMIN', '34233243', '21312', '', '23123', '123123', '', 'VN', '', '2026-01-23 16:55:08.722', '2026-01-23 16:55:08.722', NULL),
	(123, 'FS20260126-6980', 6, 'pending', 249000.00, 0.00, 25000.00, 274000.00, 'Hoang ADMIN', '0935818725', '187', '', 'Tp.HCM', 'Tp.HCM', '', 'VN', '', '2026-01-26 03:54:22.029', '2026-01-26 03:54:22.029', NULL),
	(124, 'FS20260126-2042', 59, 'pending', 1080000.00, 0.00, 25000.00, 1105000.00, 'Hoang customer', '0935818725', '187', '', 'Tp.HCM', 'Tp.HCM', '', 'VN', '', '2026-01-26 04:20:36.132', '2026-01-26 04:20:36.132', NULL),
	(125, 'FS20260127-1416', 59, 'completed', 99000.00, 0.00, 25000.00, 124000.00, 'Hoang customer', '0935818725', '187', '', 'Tp.HCM', 'Tp.HCM', '', 'VN', '', '2026-01-27 08:08:39.760', '2026-01-29 09:30:41.413', NULL),
	(126, 'FS20260129-8544', 59, 'shipped', 99000.00, 0.00, 25000.00, 124000.00, 'Hoang customer', '0935818725', '187', '', 'Tp.HCM', 'Tp.HCM', '', 'VN', '', '2026-01-29 06:53:36.743', '2026-01-29 06:55:38.063', NULL);

-- Dumping structure for table fashion_store.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `variant_id` bigint(20) unsigned NOT NULL,
  `sku` varchar(120) NOT NULL,
  `name` varchar(255) NOT NULL,
  `options_text` varchar(255) DEFAULT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `qty` int(11) NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`),
  KEY `idx_oi_variant` (`variant_id`),
  KEY `fk_oi_product` (`product_id`),
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `order_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=267 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.order_items: ~261 rows (approximately)
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `variant_id`, `sku`, `name`, `options_text`, `unit_price`, `qty`, `line_total`) VALUES
	(1, 1, 2, 1, 'TSHIRT-NU-001', 'Áo thun nữ oversize Basic', NULL, 99000.00, 2, 198000.00),
	(2, 1, 6, 10, 'BAG-001', 'Túi tote canvas', NULL, 79000.00, 1, 79000.00),
	(3, 2, 4, 6, 'TSHIRT-NAM-001', 'Áo thun nam cổ tròn Premium', NULL, 109000.00, 1, 109000.00),
	(4, 3, 7, 12, 'CAP-001', 'Mũ lưỡi trai basic', NULL, 59000.00, 1, 59000.00),
	(5, 19, 8, 14, 'DRESS-001', 'Đầm Maxi Hoa Nhí Vintage', NULL, 350000.00, 1, 350000.00),
	(6, 20, 9, 16, 'JACKET-NAM-001', 'Áo Khoác Bomber Varsity', NULL, 450000.00, 1, 450000.00),
	(7, 20, 10, 18, 'BELT-001', 'Thắt lưng da nam', NULL, 150000.00, 1, 150000.00),
	(8, 21, 32, 99, 'SKU-1769144617247-19-L', 'Túi đeo chéo mini', NULL, 211000.00, 2, 422000.00),
	(9, 21, 12, 20, 'SKIRT-001-WHITE-S', 'Chân váy xếp ly Tennis', NULL, 120000.00, 2, 240000.00),
	(10, 21, 27, 79, 'SKU-1769144617208-14-L', 'Áo blazer nữ', NULL, 378000.00, 1, 378000.00),
	(11, 22, 34, 105, 'SKU-1769144617264-21-S', 'Giày oxford nam', NULL, 335000.00, 1, 335000.00),
	(12, 23, 35, 111, 'SKU-1769144617272-22-L', 'Sandal nữ', NULL, 313000.00, 1, 313000.00),
	(13, 24, 62, 218, 'SKU-1769144617446-49-M', 'Set váy công chúa', NULL, 183000.00, 3, 549000.00),
	(14, 24, 34, 105, 'SKU-1769144617264-21-S', 'Giày oxford nam', NULL, 335000.00, 1, 335000.00),
	(15, 24, 22, 58, 'SKU-1769144617168-9-M', 'Đầm công sở thanh lịch', NULL, 464000.00, 1, 464000.00),
	(16, 25, 14, 25, 'SKU-1769144617106-1-S', 'Áo polo premium', NULL, 367000.00, 2, 734000.00),
	(17, 25, 51, 176, 'SKU-1769144617377-38-XL', 'Áo bra thể thao', NULL, 112000.00, 3, 336000.00),
	(18, 25, 40, 129, 'SKU-1769144617307-27-S', 'Thắt lưng da cao cấp', NULL, 331000.00, 3, 993000.00),
	(19, 26, 35, 109, 'SKU-1769144617272-22-S', 'Sandal nữ', NULL, 313000.00, 1, 313000.00),
	(20, 26, 57, 200, 'SKU-1769144617416-44-XL', 'Quần baggy', NULL, 383000.00, 2, 766000.00),
	(21, 26, 22, 57, 'SKU-1769144617168-9-S', 'Đầm công sở thanh lịch', NULL, 464000.00, 2, 928000.00),
	(22, 26, 13, 24, 'SKU-1769144617093-0-XL', 'Áo thun nam basic', NULL, 247000.00, 2, 494000.00),
	(23, 27, 16, 35, 'SKU-1769144617125-3-L', 'Áo khoác bomber', NULL, 394000.00, 2, 788000.00),
	(24, 27, 35, 112, 'SKU-1769144617272-22-XL', 'Sandal nữ', NULL, 313000.00, 1, 313000.00),
	(25, 27, 47, 159, 'SKU-1769144617351-34-L', 'Quần legging', NULL, 420000.00, 3, 1260000.00),
	(26, 28, 23, 61, 'SKU-1769144617176-10-S', 'Chân váy xếp ly', NULL, 474000.00, 2, 948000.00),
	(27, 28, 28, 83, 'SKU-1769144617216-15-L', 'Áo cardigan mỏng', NULL, 54000.00, 3, 162000.00),
	(28, 28, 43, 143, 'SKU-1769144617325-30-L', 'Vest nam công sở', NULL, 329000.00, 1, 329000.00),
	(29, 29, 21, 54, 'SKU-1769144617163-8-M', 'Đầm maxi hoa', NULL, 374000.00, 1, 374000.00),
	(30, 29, 35, 112, 'SKU-1769144617272-22-XL', 'Sandal nữ', NULL, 313000.00, 2, 626000.00),
	(31, 29, 52, 180, 'SKU-1769144617384-39-XL', 'Quần đùi bơi', NULL, 62000.00, 2, 124000.00),
	(32, 30, 48, 161, 'SKU-1769144617357-35-S', 'Chân váy midi', NULL, 74000.00, 1, 74000.00),
	(33, 31, 17, 40, 'SKU-1769144617133-4-XL', 'Quần jean slim fit', NULL, 419000.00, 2, 838000.00),
	(34, 32, 8, 14, 'DRESS-001-YELLOW-S', 'Đầm Maxi Hoa Nhí Vintage', NULL, 350000.00, 1, 350000.00),
	(35, 33, 50, 169, 'SKU-1769144617368-37-S', 'Đồ ngủ pijama', NULL, 282000.00, 3, 846000.00),
	(36, 34, 61, 215, 'SKU-1769144617438-48-L', 'Áo len gấu', NULL, 435000.00, 3, 1305000.00),
	(37, 34, 29, 88, 'SKU-1769144617224-16-XL', 'Túi tote canvas', NULL, 74000.00, 3, 222000.00),
	(38, 34, 20, 51, 'SKU-1769144617156-7-L', 'Quần jogger', NULL, 261000.00, 2, 522000.00),
	(39, 35, 33, 102, 'SKU-1769144617258-20-M', 'Giày sneaker trắng', NULL, 68000.00, 3, 204000.00),
	(40, 35, 6, 9, 'BAG-001-WHITE-M', 'Túi tote canvas', NULL, 79000.00, 2, 158000.00),
	(41, 36, 33, 101, 'SKU-1769144617258-20-S', 'Giày sneaker trắng', NULL, 68000.00, 2, 136000.00),
	(42, 37, 30, 92, 'SKU-1769144617231-17-XL', 'Balo laptop', NULL, 448000.00, 3, 1344000.00),
	(43, 37, 42, 140, 'SKU-1769144617319-29-XL', 'Áo flannel kẻ sọc', NULL, 158000.00, 2, 316000.00),
	(44, 38, 41, 136, 'SKU-1769144617313-28-XL', 'Áo thun oversize', NULL, 117000.00, 3, 351000.00),
	(45, 38, 32, 97, 'SKU-1769144617247-19-S', 'Túi đeo chéo mini', NULL, 211000.00, 2, 422000.00),
	(46, 38, 10, 18, 'BELT-001-BROWN-FREE', 'Thắt lưng da nam cao cấp', NULL, 150000.00, 3, 450000.00),
	(47, 39, 42, 139, 'SKU-1769144617319-29-L', 'Áo flannel kẻ sọc', NULL, 158000.00, 2, 316000.00),
	(48, 39, 59, 206, 'SKU-1769144617428-46-M', 'Váy xòe vintage', NULL, 416000.00, 2, 832000.00),
	(49, 40, 46, 154, 'SKU-1769144617343-33-M', 'Quần ống rộng', NULL, 475000.00, 2, 950000.00),
	(50, 40, 52, 179, 'SKU-1769144617384-39-L', 'Quần đùi bơi', NULL, 62000.00, 2, 124000.00),
	(51, 40, 20, 49, 'SKU-1769144617156-7-S', 'Quần jogger', NULL, 261000.00, 2, 522000.00),
	(52, 41, 44, 145, 'SKU-1769144617331-31-S', 'Áo gile len', NULL, 260000.00, 3, 780000.00),
	(53, 41, 34, 105, 'SKU-1769144617264-21-S', 'Giày oxford nam', NULL, 335000.00, 1, 335000.00),
	(54, 41, 40, 130, 'SKU-1769144617307-27-M', 'Thắt lưng da cao cấp', NULL, 331000.00, 2, 662000.00),
	(55, 41, 8, 15, 'DRESS-001-YELLOW-M', 'Đầm Maxi Hoa Nhí Vintage', NULL, 350000.00, 2, 700000.00),
	(56, 42, 13, 21, 'SKU-1769144617093-0-S', 'Áo thun nam basic', NULL, 247000.00, 2, 494000.00),
	(57, 42, 33, 103, 'SKU-1769144617258-20-L', 'Giày sneaker trắng', NULL, 68000.00, 2, 136000.00),
	(58, 42, 52, 180, 'SKU-1769144617384-39-XL', 'Quần đùi bơi', NULL, 62000.00, 1, 62000.00),
	(59, 42, 48, 162, 'SKU-1769144617357-35-M', 'Chân váy midi', NULL, 74000.00, 1, 74000.00),
	(60, 43, 43, 141, 'SKU-1769144617325-30-S', 'Vest nam công sở', NULL, 329000.00, 1, 329000.00),
	(61, 44, 57, 197, 'SKU-1769144617416-44-S', 'Quần baggy', NULL, 383000.00, 3, 1149000.00),
	(62, 44, 62, 217, 'SKU-1769144617446-49-S', 'Set váy công chúa', NULL, 183000.00, 3, 549000.00),
	(63, 44, 20, 52, 'SKU-1769144617156-7-XL', 'Quần jogger', NULL, 261000.00, 3, 783000.00),
	(64, 44, 35, 110, 'SKU-1769144617272-22-M', 'Sandal nữ', NULL, 313000.00, 1, 313000.00),
	(65, 45, 26, 73, 'SKU-1769144617201-13-S', 'Áo len cổ lọ', NULL, 305000.00, 1, 305000.00),
	(66, 45, 50, 172, 'SKU-1769144617368-37-XL', 'Đồ ngủ pijama', NULL, 282000.00, 1, 282000.00),
	(67, 46, 57, 198, 'SKU-1769144617416-44-M', 'Quần baggy', NULL, 383000.00, 2, 766000.00),
	(68, 46, 61, 214, 'SKU-1769144617438-48-M', 'Áo len gấu', NULL, 435000.00, 2, 870000.00),
	(69, 46, 18, 42, 'SKU-1769144617142-5-M', 'Quần kaki classic', NULL, 161000.00, 1, 161000.00),
	(70, 47, 52, 177, 'SKU-1769144617384-39-S', 'Quần đùi bơi', NULL, 62000.00, 2, 124000.00),
	(71, 47, 25, 72, 'SKU-1769144617191-12-XL', 'Áo hoodie unisex', NULL, 483000.00, 1, 483000.00),
	(72, 48, 44, 147, 'SKU-1769144617331-31-L', 'Áo gile len', NULL, 260000.00, 1, 260000.00),
	(73, 48, 54, 185, 'SKU-1769144617397-41-S', 'Áo tank top', NULL, 164000.00, 1, 164000.00),
	(74, 48, 30, 90, 'SKU-1769144617231-17-M', 'Balo laptop', NULL, 448000.00, 1, 448000.00),
	(75, 49, 18, 41, 'SKU-1769144617142-5-S', 'Quần kaki classic', NULL, 161000.00, 1, 161000.00),
	(76, 50, 17, 37, 'SKU-1769144617133-4-S', 'Quần jean slim fit', NULL, 419000.00, 2, 838000.00),
	(77, 50, 39, 127, 'SKU-1769144617301-26-L', 'Khăn choàng cashmere', NULL, 475000.00, 3, 1425000.00),
	(78, 50, 32, 100, 'SKU-1769144617247-19-XL', 'Túi đeo chéo mini', NULL, 211000.00, 2, 422000.00),
	(79, 51, 39, 126, 'SKU-1769144617301-26-M', 'Khăn choàng cashmere', NULL, 475000.00, 1, 475000.00),
	(80, 51, 44, 147, 'SKU-1769144617331-31-L', 'Áo gile len', NULL, 260000.00, 2, 520000.00),
	(81, 51, 12, 20, 'SKIRT-001-WHITE-S', 'Chân váy xếp ly Tennis', NULL, 120000.00, 1, 120000.00),
	(82, 51, 22, 58, 'SKU-1769144617168-9-M', 'Đầm công sở thanh lịch', NULL, 464000.00, 2, 928000.00),
	(83, 52, 26, 73, 'SKU-1769144617201-13-S', 'Áo len cổ lọ', NULL, 305000.00, 2, 610000.00),
	(84, 53, 38, 122, 'SKU-1769144617294-25-M', 'Mũ bucket hat', NULL, 276000.00, 3, 828000.00),
	(85, 53, 46, 156, 'SKU-1769144617343-33-XL', 'Quần ống rộng', NULL, 475000.00, 2, 950000.00),
	(86, 54, 39, 128, 'SKU-1769144617301-26-XL', 'Khăn choàng cashmere', NULL, 475000.00, 1, 475000.00),
	(87, 54, 43, 144, 'SKU-1769144617325-30-XL', 'Vest nam công sở', NULL, 329000.00, 2, 658000.00),
	(88, 54, 62, 219, 'SKU-1769144617446-49-L', 'Set váy công chúa', NULL, 183000.00, 1, 183000.00),
	(89, 54, 12, 20, 'SKIRT-001-WHITE-S', 'Chân váy xếp ly Tennis', NULL, 120000.00, 3, 360000.00),
	(90, 55, 25, 72, 'SKU-1769144617191-12-XL', 'Áo hoodie unisex', NULL, 483000.00, 2, 966000.00),
	(91, 55, 54, 188, 'SKU-1769144617397-41-XL', 'Áo tank top', NULL, 164000.00, 3, 492000.00),
	(92, 55, 28, 81, 'SKU-1769144617216-15-S', 'Áo cardigan mỏng', NULL, 54000.00, 1, 54000.00),
	(93, 55, 6, 10, 'BAG-001-BLACK-M', 'Túi tote canvas', NULL, 79000.00, 2, 158000.00),
	(94, 56, 25, 70, 'SKU-1769144617191-12-M', 'Áo hoodie unisex', NULL, 483000.00, 1, 483000.00),
	(95, 57, 28, 83, 'SKU-1769144617216-15-L', 'Áo cardigan mỏng', NULL, 54000.00, 3, 162000.00),
	(96, 57, 3, 3, 'SHORT-NU-001-BLACK-M', 'Quần short nữ lưng thun', NULL, 89000.00, 1, 89000.00),
	(97, 57, 25, 71, 'SKU-1769144617191-12-L', 'Áo hoodie unisex', NULL, 483000.00, 3, 1449000.00),
	(98, 57, 60, 212, 'SKU-1769144617433-47-XL', 'Đầm body sexy', NULL, 70000.00, 3, 210000.00),
	(99, 58, 11, 19, 'HOODIE-NU-001-GREY-M', 'Áo Hoodie Nữ Zip Kéo', NULL, 180000.00, 1, 180000.00),
	(100, 58, 47, 160, 'SKU-1769144617351-34-XL', 'Quần legging', NULL, 420000.00, 3, 1260000.00),
	(101, 58, 26, 75, 'SKU-1769144617201-13-L', 'Áo len cổ lọ', NULL, 305000.00, 1, 305000.00),
	(102, 58, 3, 4, 'SHORT-NU-001-GREY-L', 'Quần short nữ lưng thun', NULL, 89000.00, 1, 89000.00),
	(103, 59, 29, 85, 'SKU-1769144617224-16-S', 'Túi tote canvas', NULL, 74000.00, 3, 222000.00),
	(104, 60, 49, 168, 'SKU-1769144617363-36-XL', 'Set bộ thể thao', NULL, 180000.00, 3, 540000.00),
	(105, 61, 62, 219, 'SKU-1769144617446-49-L', 'Set váy công chúa', NULL, 183000.00, 1, 183000.00),
	(106, 61, 53, 183, 'SKU-1769144617390-40-L', 'Áo thun in họa tiết', NULL, 286000.00, 2, 572000.00),
	(107, 61, 39, 127, 'SKU-1769144617301-26-L', 'Khăn choàng cashmere', NULL, 475000.00, 1, 475000.00),
	(108, 61, 57, 197, 'SKU-1769144617416-44-S', 'Quần baggy', NULL, 383000.00, 1, 383000.00),
	(109, 62, 9, 16, 'JACKET-NAM-001-BLACK-L', 'Áo Khoác Bomber Varsity', NULL, 450000.00, 1, 450000.00),
	(110, 62, 14, 28, 'SKU-1769144617106-1-XL', 'Áo polo premium', NULL, 367000.00, 3, 1101000.00),
	(111, 62, 21, 54, 'SKU-1769144617163-8-M', 'Đầm maxi hoa', NULL, 374000.00, 1, 374000.00),
	(112, 62, 11, 19, 'HOODIE-NU-001-GREY-M', 'Áo Hoodie Nữ Zip Kéo', NULL, 180000.00, 1, 180000.00),
	(113, 63, 60, 209, 'SKU-1769144617433-47-S', 'Đầm body sexy', NULL, 70000.00, 3, 210000.00),
	(114, 63, 7, 11, 'CAP-001-BLACK-M', 'Mũ lưỡi trai basic', NULL, 59000.00, 1, 59000.00),
	(115, 63, 23, 64, 'SKU-1769144617176-10-XL', 'Chân váy xếp ly', NULL, 474000.00, 2, 948000.00),
	(116, 64, 52, 177, 'SKU-1769144617384-39-S', 'Quần đùi bơi', NULL, 62000.00, 1, 62000.00),
	(117, 65, 23, 63, 'SKU-1769144617176-10-L', 'Chân váy xếp ly', NULL, 474000.00, 3, 1422000.00),
	(118, 65, 56, 196, 'SKU-1769144617410-43-XL', 'Áo khoác gió', NULL, 350000.00, 1, 350000.00),
	(119, 65, 50, 170, 'SKU-1769144617368-37-M', 'Đồ ngủ pijama', NULL, 282000.00, 2, 564000.00),
	(120, 66, 48, 161, 'SKU-1769144617357-35-S', 'Chân váy midi', NULL, 74000.00, 1, 74000.00),
	(121, 66, 7, 11, 'CAP-001-BLACK-M', 'Mũ lưỡi trai basic', NULL, 59000.00, 1, 59000.00),
	(122, 66, 52, 177, 'SKU-1769144617384-39-S', 'Quần đùi bơi', NULL, 62000.00, 2, 124000.00),
	(123, 67, 14, 28, 'SKU-1769144617106-1-XL', 'Áo polo premium', NULL, 367000.00, 3, 1101000.00),
	(124, 67, 29, 85, 'SKU-1769144617224-16-S', 'Túi tote canvas', NULL, 74000.00, 3, 222000.00),
	(125, 67, 56, 195, 'SKU-1769144617410-43-L', 'Áo khoác gió', NULL, 350000.00, 3, 1050000.00),
	(126, 67, 37, 119, 'SKU-1769144617288-24-L', 'Mũ lưỡi trai', NULL, 219000.00, 1, 219000.00),
	(127, 68, 19, 45, 'SKU-1769144617149-6-S', 'Quần short thể thao', NULL, 317000.00, 2, 634000.00),
	(128, 69, 13, 23, 'SKU-1769144617093-0-L', 'Áo thun nam basic', NULL, 247000.00, 2, 494000.00),
	(129, 70, 25, 69, 'SKU-1769144617191-12-S', 'Áo hoodie unisex', NULL, 483000.00, 1, 483000.00),
	(130, 70, 52, 180, 'SKU-1769144617384-39-XL', 'Quần đùi bơi', NULL, 62000.00, 2, 124000.00),
	(131, 70, 43, 142, 'SKU-1769144617325-30-M', 'Vest nam công sở', NULL, 329000.00, 1, 329000.00),
	(132, 70, 36, 114, 'SKU-1769144617280-23-M', 'Dép quai ngang', NULL, 428000.00, 1, 428000.00),
	(133, 71, 25, 71, 'SKU-1769144617191-12-L', 'Áo hoodie unisex', NULL, 483000.00, 2, 966000.00),
	(134, 71, 43, 144, 'SKU-1769144617325-30-XL', 'Vest nam công sở', NULL, 329000.00, 3, 987000.00),
	(135, 72, 22, 57, 'SKU-1769144617168-9-S', 'Đầm công sở thanh lịch', NULL, 464000.00, 1, 464000.00),
	(136, 72, 17, 37, 'SKU-1769144617133-4-S', 'Quần jean slim fit', NULL, 419000.00, 3, 1257000.00),
	(137, 72, 55, 192, 'SKU-1769144617404-42-XL', 'Áo ba lỗ gym', NULL, 384000.00, 1, 384000.00),
	(138, 73, 35, 111, 'SKU-1769144617272-22-L', 'Sandal nữ', NULL, 313000.00, 1, 313000.00),
	(139, 73, 11, 19, 'HOODIE-NU-001-GREY-M', 'Áo Hoodie Nữ Zip Kéo', NULL, 180000.00, 1, 180000.00),
	(140, 73, 27, 78, 'SKU-1769144617208-14-M', 'Áo blazer nữ', NULL, 378000.00, 2, 756000.00),
	(141, 73, 38, 121, 'SKU-1769144617294-25-S', 'Mũ bucket hat', NULL, 276000.00, 2, 552000.00),
	(142, 74, 23, 61, 'SKU-1769144617176-10-S', 'Chân váy xếp ly', NULL, 474000.00, 1, 474000.00),
	(143, 74, 26, 74, 'SKU-1769144617201-13-M', 'Áo len cổ lọ', NULL, 305000.00, 1, 305000.00),
	(144, 75, 27, 79, 'SKU-1769144617208-14-L', 'Áo blazer nữ', NULL, 378000.00, 2, 756000.00),
	(145, 75, 23, 63, 'SKU-1769144617176-10-L', 'Chân váy xếp ly', NULL, 474000.00, 2, 948000.00),
	(146, 75, 45, 152, 'SKU-1769144617337-32-XL', 'Quần culottes', NULL, 398000.00, 3, 1194000.00),
	(147, 76, 15, 32, 'SKU-1769144617116-2-XL', 'Áo sơ mi công sở', NULL, 401000.00, 1, 401000.00),
	(148, 76, 29, 85, 'SKU-1769144617224-16-S', 'Túi tote canvas', NULL, 74000.00, 2, 148000.00),
	(149, 76, 28, 84, 'SKU-1769144617216-15-XL', 'Áo cardigan mỏng', NULL, 54000.00, 3, 162000.00),
	(150, 76, 19, 48, 'SKU-1769144617149-6-XL', 'Quần short thể thao', NULL, 317000.00, 1, 317000.00),
	(151, 77, 57, 198, 'SKU-1769144617416-44-M', 'Quần baggy', NULL, 383000.00, 1, 383000.00),
	(152, 77, 59, 207, 'SKU-1769144617428-46-L', 'Váy xòe vintage', NULL, 416000.00, 3, 1248000.00),
	(153, 77, 3, 4, 'SHORT-NU-001-GREY-L', 'Quần short nữ lưng thun', NULL, 89000.00, 2, 178000.00),
	(154, 77, 36, 115, 'SKU-1769144617280-23-L', 'Dép quai ngang', NULL, 428000.00, 3, 1284000.00),
	(155, 78, 29, 88, 'SKU-1769144617224-16-XL', 'Túi tote canvas', NULL, 74000.00, 3, 222000.00),
	(156, 79, 43, 143, 'SKU-1769144617325-30-L', 'Vest nam công sở', NULL, 329000.00, 1, 329000.00),
	(157, 80, 51, 174, 'SKU-1769144617377-38-M', 'Áo bra thể thao', NULL, 112000.00, 1, 112000.00),
	(158, 81, 52, 179, 'SKU-1769144617384-39-L', 'Quần đùi bơi', NULL, 62000.00, 3, 186000.00),
	(159, 81, 62, 220, 'SKU-1769144617446-49-XL', 'Set váy công chúa', NULL, 183000.00, 1, 183000.00),
	(160, 82, 42, 137, 'SKU-1769144617319-29-S', 'Áo flannel kẻ sọc', NULL, 158000.00, 1, 158000.00),
	(161, 82, 23, 64, 'SKU-1769144617176-10-XL', 'Chân váy xếp ly', NULL, 474000.00, 2, 948000.00),
	(162, 82, 28, 82, 'SKU-1769144617216-15-M', 'Áo cardigan mỏng', NULL, 54000.00, 1, 54000.00),
	(163, 83, 37, 118, 'SKU-1769144617288-24-M', 'Mũ lưỡi trai', NULL, 219000.00, 3, 657000.00),
	(164, 84, 13, 24, 'SKU-1769144617093-0-XL', 'Áo thun nam basic', NULL, 247000.00, 1, 247000.00),
	(165, 84, 56, 194, 'SKU-1769144617410-43-M', 'Áo khoác gió', NULL, 350000.00, 2, 700000.00),
	(166, 85, 41, 134, 'SKU-1769144617313-28-M', 'Áo thun oversize', NULL, 117000.00, 2, 234000.00),
	(167, 85, 26, 73, 'SKU-1769144617201-13-S', 'Áo len cổ lọ', NULL, 305000.00, 2, 610000.00),
	(168, 85, 3, 4, 'SHORT-NU-001-GREY-L', 'Quần short nữ lưng thun', NULL, 89000.00, 3, 267000.00),
	(169, 85, 49, 166, 'SKU-1769144617363-36-M', 'Set bộ thể thao', NULL, 180000.00, 1, 180000.00),
	(170, 86, 37, 119, 'SKU-1769144617288-24-L', 'Mũ lưỡi trai', NULL, 219000.00, 3, 657000.00),
	(171, 87, 16, 33, 'SKU-1769144617125-3-S', 'Áo khoác bomber', NULL, 394000.00, 1, 394000.00),
	(172, 87, 49, 167, 'SKU-1769144617363-36-L', 'Set bộ thể thao', NULL, 180000.00, 1, 180000.00),
	(173, 87, 45, 151, 'SKU-1769144617337-32-L', 'Quần culottes', NULL, 398000.00, 2, 796000.00),
	(174, 88, 39, 125, 'SKU-1769144617301-26-S', 'Khăn choàng cashmere', NULL, 475000.00, 2, 950000.00),
	(175, 88, 55, 192, 'SKU-1769144617404-42-XL', 'Áo ba lỗ gym', NULL, 384000.00, 3, 1152000.00),
	(176, 88, 21, 53, 'SKU-1769144617163-8-S', 'Đầm maxi hoa', NULL, 374000.00, 2, 748000.00),
	(177, 89, 36, 115, 'SKU-1769144617280-23-L', 'Dép quai ngang', NULL, 428000.00, 1, 428000.00),
	(178, 89, 38, 124, 'SKU-1769144617294-25-XL', 'Mũ bucket hat', NULL, 276000.00, 1, 276000.00),
	(179, 89, 37, 118, 'SKU-1769144617288-24-M', 'Mũ lưỡi trai', NULL, 219000.00, 2, 438000.00),
	(180, 90, 11, 19, 'HOODIE-NU-001-GREY-M', 'Áo Hoodie Nữ Zip Kéo', NULL, 180000.00, 3, 540000.00),
	(181, 90, 26, 73, 'SKU-1769144617201-13-S', 'Áo len cổ lọ', NULL, 305000.00, 1, 305000.00),
	(182, 91, 53, 184, 'SKU-1769144617390-40-XL', 'Áo thun in họa tiết', NULL, 286000.00, 2, 572000.00),
	(183, 91, 52, 178, 'SKU-1769144617384-39-M', 'Quần đùi bơi', NULL, 62000.00, 3, 186000.00),
	(184, 91, 53, 181, 'SKU-1769144617390-40-S', 'Áo thun in họa tiết', NULL, 286000.00, 2, 572000.00),
	(185, 92, 49, 166, 'SKU-1769144617363-36-M', 'Set bộ thể thao', NULL, 180000.00, 3, 540000.00),
	(186, 92, 25, 72, 'SKU-1769144617191-12-XL', 'Áo hoodie unisex', NULL, 483000.00, 1, 483000.00),
	(187, 92, 44, 147, 'SKU-1769144617331-31-L', 'Áo gile len', NULL, 260000.00, 1, 260000.00),
	(188, 92, 44, 147, 'SKU-1769144617331-31-L', 'Áo gile len', NULL, 260000.00, 3, 780000.00),
	(189, 93, 58, 201, 'SKU-1769144617422-45-S', 'Quần tây âu', NULL, 484000.00, 1, 484000.00),
	(190, 93, 57, 199, 'SKU-1769144617416-44-L', 'Quần baggy', NULL, 383000.00, 2, 766000.00),
	(191, 93, 55, 189, 'SKU-1769144617404-42-S', 'Áo ba lỗ gym', NULL, 384000.00, 2, 768000.00),
	(192, 93, 27, 79, 'SKU-1769144617208-14-L', 'Áo blazer nữ', NULL, 378000.00, 3, 1134000.00),
	(193, 94, 30, 89, 'SKU-1769144617231-17-S', 'Balo laptop', NULL, 448000.00, 2, 896000.00),
	(194, 94, 33, 104, 'SKU-1769144617258-20-XL', 'Giày sneaker trắng', NULL, 68000.00, 2, 136000.00),
	(195, 94, 35, 110, 'SKU-1769144617272-22-M', 'Sandal nữ', NULL, 313000.00, 3, 939000.00),
	(196, 95, 46, 154, 'SKU-1769144617343-33-M', 'Quần ống rộng', NULL, 475000.00, 2, 950000.00),
	(197, 95, 58, 201, 'SKU-1769144617422-45-S', 'Quần tây âu', NULL, 484000.00, 3, 1452000.00),
	(198, 95, 24, 67, 'SKU-1769144617183-11-L', 'Áo croptop nữ', NULL, 295000.00, 1, 295000.00),
	(199, 95, 21, 54, 'SKU-1769144617163-8-M', 'Đầm maxi hoa', NULL, 374000.00, 2, 748000.00),
	(200, 96, 52, 180, 'SKU-1769144617384-39-XL', 'Quần đùi bơi', NULL, 62000.00, 3, 186000.00),
	(201, 96, 13, 21, 'SKU-1769144617093-0-S', 'Áo thun nam basic', NULL, 247000.00, 2, 494000.00),
	(202, 97, 9, 16, 'JACKET-NAM-001-BLACK-L', 'Áo Khoác Bomber Varsity', NULL, 450000.00, 2, 900000.00),
	(203, 97, 21, 54, 'SKU-1769144617163-8-M', 'Đầm maxi hoa', NULL, 374000.00, 3, 1122000.00),
	(204, 97, 57, 200, 'SKU-1769144617416-44-XL', 'Quần baggy', NULL, 383000.00, 1, 383000.00),
	(205, 98, 61, 216, 'SKU-1769144617438-48-XL', 'Áo len gấu', NULL, 435000.00, 3, 1305000.00),
	(206, 98, 27, 77, 'SKU-1769144617208-14-S', 'Áo blazer nữ', NULL, 378000.00, 2, 756000.00),
	(207, 99, 26, 76, 'SKU-1769144617201-13-XL', 'Áo len cổ lọ', NULL, 305000.00, 2, 610000.00),
	(208, 99, 22, 60, 'SKU-1769144617168-9-XL', 'Đầm công sở thanh lịch', NULL, 464000.00, 3, 1392000.00),
	(209, 100, 52, 177, 'SKU-1769144617384-39-S', 'Quần đùi bơi', NULL, 62000.00, 1, 62000.00),
	(210, 100, 28, 83, 'SKU-1769144617216-15-L', 'Áo cardigan mỏng', NULL, 54000.00, 3, 162000.00),
	(211, 101, 25, 70, 'SKU-1769144617191-12-M', 'Áo hoodie unisex', NULL, 483000.00, 1, 483000.00),
	(212, 101, 49, 166, 'SKU-1769144617363-36-M', 'Set bộ thể thao', NULL, 180000.00, 1, 180000.00),
	(213, 102, 8, 14, 'DRESS-001-YELLOW-S', 'Đầm Maxi Hoa Nhí Vintage', NULL, 350000.00, 2, 700000.00),
	(214, 102, 57, 197, 'SKU-1769144617416-44-S', 'Quần baggy', NULL, 383000.00, 3, 1149000.00),
	(215, 102, 54, 186, 'SKU-1769144617397-41-M', 'Áo tank top', NULL, 164000.00, 2, 328000.00),
	(216, 102, 62, 218, 'SKU-1769144617446-49-M', 'Set váy công chúa', NULL, 183000.00, 3, 549000.00),
	(217, 103, 25, 71, 'SKU-1769144617191-12-L', 'Áo hoodie unisex', NULL, 483000.00, 1, 483000.00),
	(218, 103, 56, 194, 'SKU-1769144617410-43-M', 'Áo khoác gió', NULL, 350000.00, 1, 350000.00),
	(219, 104, 36, 115, 'SKU-1769144617280-23-L', 'Dép quai ngang', NULL, 428000.00, 2, 856000.00),
	(220, 105, 5, 7, 'JEAN-NAM-001-BLACK-M', 'Quần jean nam slimfit', NULL, 249000.00, 2, 498000.00),
	(221, 105, 38, 121, 'SKU-1769144617294-25-S', 'Mũ bucket hat', NULL, 276000.00, 1, 276000.00),
	(222, 105, 4, 6, 'TSHIRT-NAM-001-WHITE-XL', 'Áo thun nam cổ tròn Premium', NULL, 109000.00, 3, 327000.00),
	(223, 105, 25, 72, 'SKU-1769144617191-12-XL', 'Áo hoodie unisex', NULL, 483000.00, 1, 483000.00),
	(224, 106, 8, 14, 'DRESS-001-YELLOW-S', 'Đầm Maxi Hoa Nhí Vintage', NULL, 350000.00, 1, 350000.00),
	(225, 106, 39, 128, 'SKU-1769144617301-26-XL', 'Khăn choàng cashmere', NULL, 475000.00, 2, 950000.00),
	(226, 107, 27, 77, 'SKU-1769144617208-14-S', 'Áo blazer nữ', NULL, 378000.00, 2, 756000.00),
	(227, 107, 15, 31, 'SKU-1769144617116-2-L', 'Áo sơ mi công sở', NULL, 401000.00, 2, 802000.00),
	(228, 107, 27, 77, 'SKU-1769144617208-14-S', 'Áo blazer nữ', NULL, 378000.00, 1, 378000.00),
	(229, 107, 42, 138, 'SKU-1769144617319-29-M', 'Áo flannel kẻ sọc', NULL, 158000.00, 1, 158000.00),
	(230, 108, 20, 52, 'SKU-1769144617156-7-XL', 'Quần jogger', NULL, 261000.00, 3, 783000.00),
	(231, 108, 54, 186, 'SKU-1769144617397-41-M', 'Áo tank top', NULL, 164000.00, 2, 328000.00),
	(232, 108, 61, 214, 'SKU-1769144617438-48-M', 'Áo len gấu', NULL, 435000.00, 2, 870000.00),
	(233, 108, 29, 88, 'SKU-1769144617224-16-XL', 'Túi tote canvas', NULL, 74000.00, 1, 74000.00),
	(234, 109, 59, 205, 'SKU-1769144617428-46-S', 'Váy xòe vintage', NULL, 416000.00, 3, 1248000.00),
	(235, 109, 9, 16, 'JACKET-NAM-001-BLACK-L', 'Áo Khoác Bomber Varsity', NULL, 450000.00, 1, 450000.00),
	(236, 110, 14, 28, 'SKU-1769144617106-1-XL', 'Áo polo premium', NULL, 367000.00, 1, 367000.00),
	(237, 111, 55, 192, 'SKU-1769144617404-42-XL', 'Áo ba lỗ gym', NULL, 384000.00, 1, 384000.00),
	(238, 111, 38, 121, 'SKU-1769144617294-25-S', 'Mũ bucket hat', NULL, 276000.00, 2, 552000.00),
	(239, 112, 29, 88, 'SKU-1769144617224-16-XL', 'Túi tote canvas', NULL, 74000.00, 3, 222000.00),
	(240, 112, 18, 43, 'SKU-1769144617142-5-L', 'Quần kaki classic', NULL, 161000.00, 1, 161000.00),
	(241, 112, 1, 13, 'set-bo-ao-thun-nu-form-rong-tay-lo-quan-short-ong-rong-89-trang', 'Set Bộ Áo Thun Nữ Form Rộng Tay Lỡ + Quần Short', NULL, 75000.00, 2, 150000.00),
	(242, 112, 44, 145, 'SKU-1769144617331-31-S', 'Áo gile len', NULL, 260000.00, 3, 780000.00),
	(243, 113, 28, 83, 'SKU-1769144617216-15-L', 'Áo cardigan mỏng', NULL, 54000.00, 1, 54000.00),
	(244, 113, 20, 50, 'SKU-1769144617156-7-M', 'Quần jogger', NULL, 261000.00, 3, 783000.00),
	(245, 114, 55, 189, 'SKU-1769144617404-42-S', 'Áo ba lỗ gym', NULL, 384000.00, 1, 384000.00),
	(246, 114, 54, 186, 'SKU-1769144617397-41-M', 'Áo tank top', NULL, 164000.00, 3, 492000.00),
	(247, 114, 17, 37, 'SKU-1769144617133-4-S', 'Quần jean slim fit', NULL, 419000.00, 1, 419000.00),
	(248, 115, 62, 217, 'SKU-1769144617446-49-S', 'Set váy công chúa', NULL, 183000.00, 3, 549000.00),
	(249, 115, 37, 118, 'SKU-1769144617288-24-M', 'Mũ lưỡi trai', NULL, 219000.00, 2, 438000.00),
	(250, 116, 43, 141, 'SKU-1769144617325-30-S', 'Vest nam công sở', NULL, 329000.00, 2, 658000.00),
	(251, 116, 34, 108, 'SKU-1769144617264-21-XL', 'Giày oxford nam', NULL, 335000.00, 3, 1005000.00),
	(252, 116, 47, 160, 'SKU-1769144617351-34-XL', 'Quần legging', NULL, 420000.00, 3, 1260000.00),
	(253, 117, 32, 98, 'SKU-1769144617247-19-M', 'Túi đeo chéo mini', NULL, 211000.00, 1, 211000.00),
	(254, 118, 25, 71, 'SKU-1769144617191-12-L', 'Áo hoodie unisex', NULL, 483000.00, 3, 1449000.00),
	(255, 118, 23, 64, 'SKU-1769144617176-10-XL', 'Chân váy xếp ly', NULL, 474000.00, 3, 1422000.00),
	(256, 119, 21, 54, 'SKU-1769144617163-8-M', 'Đầm maxi hoa', NULL, 374000.00, 2, 748000.00),
	(257, 119, 53, 184, 'SKU-1769144617390-40-XL', 'Áo thun in họa tiết', NULL, 286000.00, 1, 286000.00),
	(258, 119, 3, 3, 'SHORT-NU-001-BLACK-M', 'Quần short nữ lưng thun', NULL, 89000.00, 1, 89000.00),
	(259, 119, 62, 217, 'SKU-1769144617446-49-S', 'Set váy công chúa', NULL, 183000.00, 3, 549000.00),
	(260, 120, 37, 117, 'SKU-1769144617288-24-S', 'Mũ lưỡi trai', NULL, 219000.00, 3, 657000.00),
	(262, 122, 2, 1, 'TSHIRT-NU-001-BLACK-M', 'Áo thun nữ oversize Basic', 'Màu sắc: Đen, Màu sắc: Đỏ', 99000.00, 1, 99000.00),
	(263, 123, 5, 7, 'JEAN-NAM-001-BLACK-M', 'Quần jean nam slimfit', '', 249000.00, 1, 249000.00),
	(264, 124, 28, 81, 'SKU-1769144617216-15-S', 'Áo cardigan mỏng', '', 54000.00, 20, 1080000.00),
	(265, 125, 2, 1, 'TSHIRT-NU-001-BLACK-M', 'Áo thun nữ oversize Basic', 'Màu sắc: Đen, Màu sắc: Đỏ', 99000.00, 1, 99000.00),
	(266, 126, 2, 1, 'TSHIRT-NU-001-BLACK-M', 'Áo thun nữ oversize Basic', 'Màu sắc: Đen, Màu sắc: Đỏ', 99000.00, 1, 99000.00);

-- Dumping structure for table fashion_store.payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `method` enum('cod','bank_transfer','momo','zalopay','vnpay','paypal','stripe') NOT NULL,
  `status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `amount` decimal(12,2) NOT NULL,
  `transaction_ref` varchar(200) DEFAULT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_pay_order` (`order_id`),
  CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.payments: ~5 rows (approximately)
INSERT INTO `payments` (`id`, `order_id`, `method`, `status`, `amount`, `transaction_ref`, `paid_at`, `created_at`) VALUES
	(4, 122, 'cod', 'pending', 134000.00, NULL, NULL, '2026-01-23 16:55:08.734'),
	(5, 123, 'momo', 'pending', 274000.00, NULL, NULL, '2026-01-26 03:54:22.043'),
	(6, 124, 'cod', 'pending', 1105000.00, NULL, NULL, '2026-01-26 04:20:36.142'),
	(7, 125, 'cod', 'pending', 124000.00, NULL, NULL, '2026-01-27 08:08:39.773'),
	(8, 126, 'cod', 'pending', 124000.00, NULL, NULL, '2026-01-29 06:53:36.749');

-- Dumping structure for table fashion_store.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.permissions: ~4 rows (approximately)
INSERT INTO `permissions` (`id`, `name`, `description`, `created_at`) VALUES
	(1, 'admin', 'Quản trị viên hệ thống', '2026-01-23 15:31:44.000'),
	(2, 'customer', 'Khách hàng', '2026-01-23 15:31:44.000'),
	(3, 'manager', 'Quản lý ', '2026-01-23 15:39:39.000'),
	(4, 'staff', 'Nhân viên', '2026-01-29 19:40:42.000');

-- Dumping structure for table fashion_store.products
CREATE TABLE IF NOT EXISTS `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `sku` varchar(80) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(270) NOT NULL,
  `description` longtext DEFAULT NULL,
  `base_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `compare_at_price` decimal(12,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  `brand_id` bigint(20) unsigned DEFAULT NULL,
  `cost_price` decimal(12,2) DEFAULT 0.00,
  `height` decimal(10,2) DEFAULT 0.00,
  `length` decimal(10,2) DEFAULT 0.00,
  `meta_description` varchar(500) DEFAULT NULL,
  `meta_keywords` varchar(255) DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `tax_rate` decimal(5,2) DEFAULT 0.00,
  `weight` decimal(10,2) DEFAULT 0.00,
  `width` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_sku_key` (`sku`),
  UNIQUE KEY `products_slug_key` (`slug`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_brand` (`brand_id`),
  CONSTRAINT `products_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.products: ~62 rows (approximately)
INSERT INTO `products` (`id`, `category_id`, `sku`, `size`, `name`, `slug`, `description`, `base_price`, `compare_at_price`, `is_active`, `created_at`, `updated_at`, `brand_id`, `cost_price`, `height`, `length`, `meta_description`, `meta_keywords`, `meta_title`, `tags`, `tax_rate`, `weight`, `width`) VALUES
	(1, 1, '89', NULL, 'Set Bộ Áo Thun Nữ Form Rộng Tay Lỡ + Quần Short', 'set-bo-ao-thun-nu-form-rong-tay-lo', '<p>Chất liệu cotton su. and</p>', 70000.00, 65000.00, 1, '2026-01-22 21:09:18.582', '2026-01-26 03:21:21.253', 1, 0.00, 0.00, 0.00, '', '', '', '', 0.00, 0.00, 0.00),
	(2, 4, 'TSHIRT-NU-001', NULL, 'Áo thun nữ oversize Basic', 'ao-thun-nu-oversize-basic', 'Áo thun oversize...', 99000.00, 129000.00, 1, '2026-01-22 21:09:18.582', '2026-01-22 14:59:32.006', NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(3, 5, 'SHORT-NU-001', NULL, 'Quần short nữ lưng thun', 'quan-short-nu-lung-thun', 'Quần short nữ...', 89000.00, 119000.00, 1, '2026-01-22 21:09:18.582', '2026-01-22 15:06:18.418', NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(4, 6, 'TSHIRT-NAM-001', NULL, 'Áo thun nam cổ tròn Premium', 'ao-thun-nam-co-tron-premium', 'Vải dày dặn...', 109000.00, 149000.00, 1, '2026-01-22 21:09:18.582', NULL, 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(5, 7, 'JEAN-NAM-001', NULL, 'Quần jean nam slimfit', 'quan-jean-nam-slimfit', 'Jean co giãn...', 249000.00, 299000.00, 1, '2026-01-22 21:09:18.582', NULL, 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(6, 8, 'BAG-001', NULL, 'Túi tote canvas', 'tui-tote-canvas', 'Túi tote canvas...', 79000.00, 99000.00, 1, '2026-01-22 21:09:18.582', NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(7, NULL, 'CAP-001', NULL, 'Mũ lưỡi trai basic', 'mu-luoi-trai-basic', 'Mũ basic...', 59000.00, 49997.00, 1, '2026-01-22 21:09:18.582', NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(8, 6, 'DRESS-001', NULL, 'Đầm Maxi Hoa Nhí Vintage', 'dam-maxi-hoa-nhi-vintage', '<p>Đầm maxi voan lụa in hoa, phù hợp đi biển.</p>', 350000.00, 450000.00, 1, '2026-01-22 21:09:18.582', NULL, 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(9, 7, 'JACKET-NAM-001', NULL, 'Áo Khoác Bomber Varsity', 'ao-khoac-bomber-varsity', '<p>Áo khoác phong cách bóng chày.</p>', 450000.00, 600000.00, 1, '2026-01-22 21:09:18.582', NULL, 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(10, 11, 'BELT-001', NULL, 'Thắt lưng da nam cao cấp', 'that-lung-da-nam', 'Da bò thật 100%.', 150000.00, 200000.00, 1, '2026-01-22 21:09:18.582', '2026-01-22 14:24:39.220', 4, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(11, 4, 'HOODIE-NU-001', NULL, 'Áo Hoodie Nữ Zip Kéo', 'ao-hoodie-nu-zip-keo', 'Nỉ bông dày dặn.', 180000.00, 250000.00, 1, '2026-01-22 21:09:18.582', NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(12, 5, 'SKIRT-001', NULL, 'Chân váy xếp ly Tennis', 'chan-vay-xep-ly-tennis', 'Vải Kaki đứng form.', 120000.00, 160000.00, 1, '2026-01-22 21:09:18.582', NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(13, NULL, 'SKU-1769144617093-0', NULL, 'Áo thun nam basic', 'ao-thun-nam-basic-4776', '<p>Sản phẩm Áo thun nam basic chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 247000.00, 296400.00, 1, '2025-12-02 13:54:31.814', '2026-01-23 05:03:37.094', 4, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(14, 11, 'SKU-1769144617106-1', NULL, 'Áo polo premium', 'ao-polo-premium-9651', '<p>Sản phẩm Áo polo premium chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 367000.00, 440400.00, 1, '2025-08-06 10:20:46.915', '2026-01-23 05:03:37.107', 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(15, 11, 'SKU-1769144617116-2', NULL, 'Áo sơ mi công sở', 'ao-so-mi-cong-so-2552', '<p>Sản phẩm Áo sơ mi công sở chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 401000.00, 481200.00, 1, '2025-09-20 03:03:17.152', '2026-01-23 05:03:37.117', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(16, NULL, 'SKU-1769144617125-3', NULL, 'Áo khoác bomber', 'ao-khoac-bomber-1564', '<p>Sản phẩm Áo khoác bomber chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 394000.00, 472800.00, 1, '2025-11-18 05:22:41.559', '2026-01-23 05:03:37.126', 4, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(17, 10, 'SKU-1769144617133-4', NULL, 'Quần jean slim fit', 'quan-jean-slim-fit-1484', '<p>Sản phẩm Quần jean slim fit chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 419000.00, 502800.00, 1, '2025-11-16 16:01:19.676', '2026-01-23 05:03:37.134', 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(18, NULL, 'SKU-1769144617142-5', NULL, 'Quần kaki classic', 'quan-kaki-classic-9282', '<p>Sản phẩm Quần kaki classic chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 161000.00, 193200.00, 1, '2025-09-24 12:33:15.542', '2026-01-23 05:03:37.143', 4, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(19, 11, 'SKU-1769144617149-6', NULL, 'Quần short thể thao', 'quan-short-the-thao-3494', '<p>Sản phẩm Quần short thể thao chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 317000.00, 380400.00, 1, '2025-06-21 05:12:25.111', '2026-01-23 05:03:37.150', 4, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(20, NULL, 'SKU-1769144617156-7', NULL, 'Quần jogger', 'quan-jogger-2679', '<p>Sản phẩm Quần jogger chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 261000.00, 313200.00, 1, '2025-12-09 12:45:22.541', '2026-01-23 05:03:37.156', 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(21, NULL, 'SKU-1769144617163-8', NULL, 'Đầm maxi hoa', 'dam-maxi-hoa-3484', '<p>Sản phẩm Đầm maxi hoa chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 374000.00, 448800.00, 1, '2026-01-03 11:53:32.440', '2026-01-23 05:03:37.164', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(22, 10, 'SKU-1769144617168-9', NULL, 'Đầm công sở thanh lịch', 'dam-cong-so-thanh-lich-4143', '<p>Sản phẩm Đầm công sở thanh lịch chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 464000.00, 556800.00, 1, '2025-12-17 04:05:01.411', '2026-01-23 05:03:37.169', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(23, NULL, 'SKU-1769144617176-10', NULL, 'Chân váy xếp ly', 'chan-vay-xep-ly-4599', '<p>Sản phẩm Chân váy xếp ly chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 474000.00, 568800.00, 1, '2025-06-26 18:49:28.896', '2026-01-23 05:03:37.176', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(24, 1, 'SKU-1769144617183-11', NULL, 'Áo croptop nữ', 'ao-croptop-nu-5564', '<p>Sản phẩm Áo croptop nữ chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 295000.00, 354000.00, 1, '2025-09-08 18:41:08.241', '2026-01-23 05:03:37.183', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(25, 11, 'SKU-1769144617191-12', NULL, 'Áo hoodie unisex', 'ao-hoodie-unisex-8722', '<p>Sản phẩm Áo hoodie unisex chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 483000.00, 579600.00, 1, '2025-12-18 18:25:22.978', '2026-01-23 05:03:37.192', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(26, NULL, 'SKU-1769144617201-13', NULL, 'Áo len cổ lọ', 'ao-len-co-lo-8832', '<p>Sản phẩm Áo len cổ lọ chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 305000.00, 366000.00, 1, '2025-08-15 16:54:28.993', '2026-01-23 05:03:37.202', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(27, NULL, 'SKU-1769144617208-14', NULL, 'Áo blazer nữ', 'ao-blazer-nu-9219', '<p>Sản phẩm Áo blazer nữ chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 378000.00, 453600.00, 1, '2025-12-28 10:12:07.235', '2026-01-23 05:03:37.209', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(28, NULL, 'SKU-1769144617216-15', NULL, 'Áo cardigan mỏng', 'ao-cardigan-mong-4989', '<p>Sản phẩm Áo cardigan mỏng chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 54000.00, 64800.00, 1, '2025-10-01 12:29:14.637', '2026-01-23 05:03:37.217', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(29, 10, 'SKU-1769144617224-16', NULL, 'Túi tote canvas', 'tui-tote-canvas-8922', '<p>Sản phẩm Túi tote canvas chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 74000.00, 88800.00, 1, '2025-09-06 04:16:48.487', '2026-01-23 05:03:37.225', 4, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(30, 11, 'SKU-1769144617231-17', NULL, 'Balo laptop', 'balo-laptop-5523', '<p>Sản phẩm Balo laptop chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 448000.00, 537600.00, 1, '2025-06-12 16:46:00.831', '2026-01-23 05:03:37.232', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(31, 5, 'SKU-1769144617239-18', NULL, 'Ví da nam', 'vi-da-nam-4878', '<p>Sản phẩm Ví da nam chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 174000.00, 208800.00, 1, '2025-12-01 08:12:32.852', '2026-01-23 05:03:37.240', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(32, 7, 'SKU-1769144617247-19', NULL, 'Túi đeo chéo mini', 'tui-deo-cheo-mini-7691', '<p>Sản phẩm Túi đeo chéo mini chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 211000.00, 253200.00, 1, '2025-11-22 12:23:52.790', '2026-01-23 05:03:37.248', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(33, NULL, 'SKU-1769144617258-20', NULL, 'Giày sneaker trắng', 'giay-sneaker-trang-2722', '<p>Sản phẩm Giày sneaker trắng chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 68000.00, 81600.00, 1, '2025-06-16 02:31:31.477', '2026-01-23 05:03:37.258', 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(34, NULL, 'SKU-1769144617264-21', NULL, 'Giày oxford nam', 'giay-oxford-nam-1376', '<p>Sản phẩm Giày oxford nam chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 335000.00, 402000.00, 1, '2025-12-31 13:16:59.379', '2026-01-23 05:03:37.265', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(35, NULL, 'SKU-1769144617272-22', NULL, 'Sandal nữ', 'sandal-nu-2797', '<p>Sản phẩm Sandal nữ chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 313000.00, 375600.00, 1, '2025-07-03 03:10:33.628', '2026-01-23 05:03:37.273', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(36, 6, 'SKU-1769144617280-23', NULL, 'Dép quai ngang', 'dep-quai-ngang-8523', '<p>Sản phẩm Dép quai ngang chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 428000.00, 513600.00, 1, '2025-08-26 11:23:31.576', '2026-01-23 05:03:37.281', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(37, 7, 'SKU-1769144617288-24', NULL, 'Mũ lưỡi trai', 'mu-luoi-trai-4273', '<p>Sản phẩm Mũ lưỡi trai chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 219000.00, 262800.00, 1, '2026-01-10 00:46:15.144', '2026-01-23 05:03:37.289', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(38, NULL, 'SKU-1769144617294-25', NULL, 'Mũ bucket hat', 'mu-bucket-hat-8531', '<p>Sản phẩm Mũ bucket hat chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 276000.00, 331200.00, 1, '2025-07-16 02:43:56.888', '2026-01-23 05:03:37.295', 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(39, NULL, 'SKU-1769144617301-26', NULL, 'Khăn choàng cashmere', 'khan-choang-cashmere-4927', '<p>Sản phẩm Khăn choàng cashmere chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 475000.00, 570000.00, 1, '2025-08-31 22:29:40.577', '2026-01-23 05:03:37.302', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(40, NULL, 'SKU-1769144617307-27', NULL, 'Thắt lưng da cao cấp', 'that-lung-da-cao-cap-4983', '<p>Sản phẩm Thắt lưng da cao cấp chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 331000.00, 397200.00, 1, '2025-10-25 15:38:43.155', '2026-01-23 05:03:37.308', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(41, NULL, 'SKU-1769144617313-28', NULL, 'Áo thun oversize', 'ao-thun-oversize-7522', '<p>Sản phẩm Áo thun oversize chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 117000.00, 140400.00, 1, '2025-09-29 22:21:31.747', '2026-01-23 05:03:37.313', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(42, 7, 'SKU-1769144617319-29', NULL, 'Áo flannel kẻ sọc', 'ao-flannel-ke-soc-7014', '<p>Sản phẩm Áo flannel kẻ sọc chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 158000.00, 189600.00, 1, '2025-10-20 01:55:57.512', '2026-01-23 05:03:37.320', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(43, 7, 'SKU-1769144617325-30', NULL, 'Vest nam công sở', 'vest-nam-cong-so-6976', '<p>Sản phẩm Vest nam công sở chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 329000.00, 394800.00, 1, '2025-06-03 12:32:35.486', '2026-01-23 05:03:37.326', 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(44, NULL, 'SKU-1769144617331-31', NULL, 'Áo gile len', 'ao-gile-len-6760', '<p>Sản phẩm Áo gile len chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 260000.00, 312000.00, 1, '2026-01-04 22:17:00.119', '2026-01-23 05:03:37.332', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(45, 5, 'SKU-1769144617337-32', NULL, 'Quần culottes', 'quan-culottes-5427', '<p>Sản phẩm Quần culottes chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 398000.00, 477600.00, 1, '2025-09-30 05:19:38.709', '2026-01-23 05:03:37.337', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(46, NULL, 'SKU-1769144617343-33', NULL, 'Quần ống rộng', 'quan-ong-rong-6403', '<p>Sản phẩm Quần ống rộng chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 475000.00, 570000.00, 1, '2025-11-01 17:05:52.673', '2026-01-23 05:03:37.344', 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(47, NULL, 'SKU-1769144617351-34', NULL, 'Quần legging', 'quan-legging-4098', '<p>Sản phẩm Quần legging chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 420000.00, 504000.00, 1, '2025-08-24 23:46:05.506', '2026-01-23 05:03:37.352', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(48, 5, 'SKU-1769144617357-35', NULL, 'Chân váy midi', 'chan-vay-midi-9664', '<p>Sản phẩm Chân váy midi chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 74000.00, 88800.00, 1, '2025-06-14 10:16:44.785', '2026-01-23 05:03:37.358', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(49, NULL, 'SKU-1769144617363-36', NULL, 'Set bộ thể thao', 'set-bo-the-thao-3965', '<p>Sản phẩm Set bộ thể thao chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 180000.00, 216000.00, 1, '2025-06-30 03:50:04.973', '2026-01-23 05:03:37.364', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(50, NULL, 'SKU-1769144617368-37', NULL, 'Đồ ngủ pijama', 'do-ngu-pijama-9059', '<p>Sản phẩm Đồ ngủ pijama chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 282000.00, 338400.00, 1, '2025-12-16 17:49:47.910', '2026-01-23 05:03:37.369', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(51, NULL, 'SKU-1769144617377-38', NULL, 'Áo bra thể thao', 'ao-bra-the-thao-8164', '<p>Sản phẩm Áo bra thể thao chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 112000.00, 134400.00, 1, '2025-06-05 09:17:05.647', '2026-01-23 05:03:37.378', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(52, NULL, 'SKU-1769144617384-39', NULL, 'Quần đùi bơi', 'quan-dui-boi-8853', '<p>Sản phẩm Quần đùi bơi chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 62000.00, 74400.00, 1, '2025-09-21 18:46:07.408', '2026-01-23 05:03:37.385', 3, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(53, 1, 'SKU-1769144617390-40', NULL, 'Áo thun in họa tiết', 'ao-thun-in-hoa-tiet-6637', '<p>Sản phẩm Áo thun in họa tiết chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 286000.00, 343200.00, 1, '2025-09-03 22:36:20.186', '2026-01-23 05:03:37.391', 4, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(54, NULL, 'SKU-1769144617397-41', NULL, 'Áo tank top', 'ao-tank-top-9183', '<p>Sản phẩm Áo tank top chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 164000.00, 196800.00, 1, '2025-11-08 05:05:22.697', '2026-01-23 05:03:37.398', 1, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(55, 4, 'SKU-1769144617404-42', NULL, 'Áo ba lỗ gym', 'ao-ba-lo-gym-9574', '<p>Sản phẩm Áo ba lỗ gym chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 384000.00, 460800.00, 1, '2025-12-18 23:01:27.565', '2026-01-23 05:03:37.404', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(56, 4, 'SKU-1769144617410-43', NULL, 'Áo khoác gió', 'ao-khoac-gio-7917', '<p>Sản phẩm Áo khoác gió chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 350000.00, 420000.00, 1, '2025-07-06 05:23:07.856', '2026-01-23 05:03:37.410', 4, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(57, 10, 'SKU-1769144617416-44', NULL, 'Quần baggy', 'quan-baggy-1109', '<p>Sản phẩm Quần baggy chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 383000.00, 459600.00, 1, '2025-10-17 21:32:21.876', '2026-01-23 05:03:37.417', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(58, NULL, 'SKU-1769144617422-45', NULL, 'Quần tây âu', 'quan-tay-au-4117', '<p>Sản phẩm Quần tây âu chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 484000.00, 580800.00, 1, '2025-09-01 10:38:56.683', '2026-01-23 05:03:37.422', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(59, NULL, 'SKU-1769144617428-46', NULL, 'Váy xòe vintage', 'vay-xoe-vintage-5187', '<p>Sản phẩm Váy xòe vintage chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 416000.00, 499200.00, 1, '2025-11-24 15:57:39.080', '2026-01-23 05:03:37.429', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(60, 5, 'SKU-1769144617433-47', NULL, 'Đầm body sexy', 'dam-body-sexy-7904', '<p>Sản phẩm Đầm body sexy chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 70000.00, 84000.00, 1, '2025-12-08 14:07:04.685', '2026-01-23 05:03:37.434', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(61, 8, 'SKU-1769144617438-48', NULL, 'Áo len gấu', 'ao-len-gau-9264', '<p>Sản phẩm Áo len gấu chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 435000.00, 522000.00, 1, '2025-09-25 10:45:33.627', '2026-01-23 05:03:37.439', 2, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00),
	(62, NULL, 'SKU-1769144617446-49', NULL, 'Set váy công chúa', 'set-vay-cong-chua-7730', '<p>Sản phẩm Set váy công chúa chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>', 183000.00, 219600.00, 1, '2025-09-30 12:20:14.981', '2026-01-23 05:03:37.446', 4, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00);

-- Dumping structure for table fashion_store.product_attributes
CREATE TABLE IF NOT EXISTS `product_attributes` (
  `product_id` bigint(20) unsigned NOT NULL,
  `option_id` bigint(20) unsigned NOT NULL,
  `option_value_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`product_id`,`option_id`),
  KEY `idx_pa_option_value` (`option_value_id`),
  KEY `idx_pa_option` (`option_id`),
  CONSTRAINT `product_attributes_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `product_attributes_option_value_id_fkey` FOREIGN KEY (`option_value_id`) REFERENCES `option_values` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `product_attributes_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.product_attributes: ~0 rows (approximately)

-- Dumping structure for table fashion_store.product_collections
CREATE TABLE IF NOT EXISTS `product_collections` (
  `product_id` bigint(20) unsigned NOT NULL,
  `collection_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`product_id`,`collection_id`),
  KEY `idx_pc_collection` (`collection_id`),
  CONSTRAINT `product_collections_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `product_collections_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.product_collections: ~0 rows (approximately)

-- Dumping structure for table fashion_store.product_images
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `url` varchar(1000) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `variant_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pi_product` (`product_id`),
  KEY `idx_pi_variant` (`variant_id`),
  CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `product_images_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.product_images: ~13 rows (approximately)
INSERT INTO `product_images` (`id`, `product_id`, `url`, `alt_text`, `is_primary`, `sort_order`, `created_at`, `variant_id`) VALUES
	(4, 4, 'http://localhost:4000/uploads/sample-ao-nam-1.webp', NULL, 1, 0, '2026-01-22 21:09:18.616', NULL),
	(5, 5, 'http://localhost:4000/uploads/sample-jean-nam-1.webp', NULL, 1, 0, '2026-01-22 21:09:18.616', NULL),
	(6, 6, 'http://localhost:4000/uploads/sample-tote-1.webp', NULL, 1, 0, '2026-01-22 21:09:18.616', NULL),
	(7, 7, 'http://localhost:4000/uploads/sample-cap-1.webp', NULL, 1, 0, '2026-01-22 21:09:18.616', NULL),
	(8, 8, 'http://localhost:4000/uploads/sample-dress-001.webp', NULL, 1, 0, '2026-01-22 21:09:18.616', NULL),
	(9, 9, 'http://localhost:4000/uploads/sample-jacket-001.webp', NULL, 1, 0, '2026-01-22 21:09:18.616', NULL),
	(11, 11, 'http://localhost:4000/uploads/sample-hoodie-001.webp', NULL, 1, 0, '2026-01-22 21:09:18.616', NULL),
	(12, 12, 'http://localhost:4000/uploads/sample-skirt-001.webp', NULL, 1, 0, '2026-01-22 21:09:18.616', NULL),
	(55, 2, 'http://localhost:4000/uploads/1769093962807-640257785.webp', NULL, 1, 0, '2026-01-22 14:59:32.012', NULL),
	(56, 2, 'http://localhost:4000/uploads/1769093971996-308099457.png', NULL, 0, 1, '2026-01-22 14:59:32.012', NULL),
	(61, 3, 'http://localhost:4000/uploads/1769094378404-581998447.webp', NULL, 1, 0, '2026-01-22 15:06:18.426', NULL),
	(66, 1, 'http://localhost:4000/uploads/1769094301311-794242468.png', NULL, 1, 0, '2026-01-26 03:21:21.283', NULL),
	(67, 1, 'http://localhost:4000/uploads/1769094312782-549414451.webp', NULL, 0, 1, '2026-01-26 03:21:21.283', NULL);

-- Dumping structure for table fashion_store.product_reviews
CREATE TABLE IF NOT EXISTS `product_reviews` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `rating` tinyint(4) NOT NULL DEFAULT 5,
  `title` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `author_name` varchar(200) DEFAULT NULL,
  `status` enum('pending','approved','rejected','hidden') NOT NULL DEFAULT 'pending',
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `helpful_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_product` (`product_id`),
  KEY `idx_reviews_status` (`status`),
  CONSTRAINT `product_reviews_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.product_reviews: ~1 rows (approximately)
INSERT INTO `product_reviews` (`id`, `product_id`, `user_id`, `rating`, `title`, `content`, `author_name`, `status`, `is_verified`, `helpful_count`, `created_at`, `updated_at`) VALUES
	(1, 5, 6, 5, 'ssv', 'ssv', 'Hoang ADMIN', 'approved', 0, 0, '2026-01-24 09:45:20.709', '2026-01-26 04:18:56.009');

-- Dumping structure for table fashion_store.product_variants
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `variant_sku` varchar(120) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `compare_at_price` decimal(12,2) DEFAULT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `stock_qty` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  `height` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(1000) DEFAULT NULL,
  `length` decimal(10,2) DEFAULT NULL,
  `weight` decimal(10,2) DEFAULT NULL,
  `width` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_variants_variant_sku_key` (`variant_sku`),
  KEY `idx_variants_product` (`product_id`),
  CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=221 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.product_variants: ~220 rows (approximately)
INSERT INTO `product_variants` (`id`, `product_id`, `variant_sku`, `price`, `compare_at_price`, `cost`, `stock_qty`, `is_active`, `created_at`, `updated_at`, `height`, `image_url`, `length`, `weight`, `width`) VALUES
	(1, 2, 'TSHIRT-NU-001-BLACK-M', 99000.00, 129000.00, NULL, 46, 1, '2026-01-22 21:09:18.601', '2026-01-29 06:53:36.746', NULL, NULL, NULL, NULL, NULL),
	(2, 2, 'TSHIRT-NU-001-WHITE-L', 99000.00, 129000.00, NULL, 35, 1, '2026-01-22 21:09:18.601', '2026-01-22 14:59:32.009', NULL, NULL, NULL, NULL, NULL),
	(3, 3, 'SHORT-NU-001-BLACK-M', 89000.00, 119000.00, NULL, 40, 1, '2026-01-22 21:09:18.601', '2026-01-22 15:06:18.423', NULL, NULL, NULL, NULL, NULL),
	(4, 3, 'SHORT-NU-001-GREY-L', 89000.00, 119000.00, NULL, 25, 1, '2026-01-22 21:09:18.601', '2026-01-22 15:06:18.424', NULL, NULL, NULL, NULL, NULL),
	(5, 4, 'TSHIRT-NAM-001-BLACK-L', 109000.00, 149000.00, NULL, 60, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(6, 4, 'TSHIRT-NAM-001-WHITE-XL', 109000.00, 149000.00, NULL, 30, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(7, 5, 'JEAN-NAM-001-BLACK-M', 249000.00, 299000.00, NULL, 19, 1, '2026-01-22 21:09:18.601', '2026-01-26 03:54:22.035', NULL, NULL, NULL, NULL, NULL),
	(8, 5, 'JEAN-NAM-001-GREY-L', 249000.00, 299000.00, NULL, 15, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(9, 6, 'BAG-001-WHITE-M', 79000.00, 99000.00, NULL, 70, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(10, 6, 'BAG-001-BLACK-M', 79000.00, 99000.00, NULL, 55, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(11, 7, 'CAP-001-BLACK-M', 59000.00, 79000.00, NULL, 105, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(12, 7, 'CAP-001-WHITE-M', 59000.00, 79000.00, NULL, 65, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(13, 1, 'set-bo-ao-thun-nu-form-rong-tay-lo-quan-short-ong-rong-89-trang', 75000.00, 94000.00, NULL, 0, 1, '2026-01-22 21:09:18.601', '2026-01-26 03:21:21.279', NULL, NULL, NULL, NULL, NULL),
	(14, 8, 'DRESS-001-YELLOW-S', 350000.00, 450000.00, NULL, 10, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(15, 8, 'DRESS-001-YELLOW-M', 350000.00, 450000.00, NULL, 12, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(16, 9, 'JACKET-NAM-001-BLACK-L', 450000.00, 600000.00, NULL, 8, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(17, 9, 'JACKET-NAM-001-BLACK-XL', 450000.00, 600000.00, NULL, 5, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(18, 10, 'BELT-001-BROWN-FREE', 150000.00, 200000.00, NULL, 50, 1, '2026-01-22 21:09:18.601', '2026-01-22 14:24:39.223', NULL, NULL, NULL, NULL, NULL),
	(19, 11, 'HOODIE-NU-001-GREY-M', 180000.00, 250000.00, NULL, 30, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(20, 12, 'SKIRT-001-WHITE-S', 120000.00, 160000.00, NULL, 25, 1, '2026-01-22 21:09:18.601', NULL, NULL, NULL, NULL, NULL, NULL),
	(21, 13, 'SKU-1769144617093-0-S', 247000.00, 296400.00, NULL, 67, 1, '2026-01-23 05:03:37.099', '2026-01-23 05:03:37.099', NULL, NULL, NULL, NULL, NULL),
	(22, 13, 'SKU-1769144617093-0-M', 247000.00, 296400.00, NULL, 68, 1, '2026-01-23 05:03:37.101', '2026-01-23 05:03:37.101', NULL, NULL, NULL, NULL, NULL),
	(23, 13, 'SKU-1769144617093-0-L', 247000.00, 296400.00, NULL, 14, 1, '2026-01-23 05:03:37.104', '2026-01-23 05:03:37.104', NULL, NULL, NULL, NULL, NULL),
	(24, 13, 'SKU-1769144617093-0-XL', 247000.00, 296400.00, NULL, 58, 1, '2026-01-23 05:03:37.105', '2026-01-23 05:03:37.105', NULL, NULL, NULL, NULL, NULL),
	(25, 14, 'SKU-1769144617106-1-S', 367000.00, 440400.00, NULL, 47, 1, '2026-01-23 05:03:37.109', '2026-01-23 05:03:37.109', NULL, NULL, NULL, NULL, NULL),
	(26, 14, 'SKU-1769144617106-1-M', 367000.00, 440400.00, NULL, 30, 1, '2026-01-23 05:03:37.111', '2026-01-23 05:03:37.111', NULL, NULL, NULL, NULL, NULL),
	(27, 14, 'SKU-1769144617106-1-L', 367000.00, 440400.00, NULL, 59, 1, '2026-01-23 05:03:37.114', '2026-01-23 05:03:37.114', NULL, NULL, NULL, NULL, NULL),
	(28, 14, 'SKU-1769144617106-1-XL', 367000.00, 440400.00, NULL, 60, 1, '2026-01-23 05:03:37.116', '2026-01-23 05:03:37.116', NULL, NULL, NULL, NULL, NULL),
	(29, 15, 'SKU-1769144617116-2-S', 401000.00, 481200.00, NULL, 24, 1, '2026-01-23 05:03:37.119', '2026-01-23 05:03:37.119', NULL, NULL, NULL, NULL, NULL),
	(30, 15, 'SKU-1769144617116-2-M', 401000.00, 481200.00, NULL, 30, 1, '2026-01-23 05:03:37.121', '2026-01-23 05:03:37.121', NULL, NULL, NULL, NULL, NULL),
	(31, 15, 'SKU-1769144617116-2-L', 401000.00, 481200.00, NULL, 86, 1, '2026-01-23 05:03:37.123', '2026-01-23 05:03:37.123', NULL, NULL, NULL, NULL, NULL),
	(32, 15, 'SKU-1769144617116-2-XL', 401000.00, 481200.00, NULL, 85, 1, '2026-01-23 05:03:37.124', '2026-01-23 05:03:37.124', NULL, NULL, NULL, NULL, NULL),
	(33, 16, 'SKU-1769144617125-3-S', 394000.00, 472800.00, NULL, 29, 1, '2026-01-23 05:03:37.129', '2026-01-23 05:03:37.129', NULL, NULL, NULL, NULL, NULL),
	(34, 16, 'SKU-1769144617125-3-M', 394000.00, 472800.00, NULL, 43, 1, '2026-01-23 05:03:37.130', '2026-01-23 05:03:37.130', NULL, NULL, NULL, NULL, NULL),
	(35, 16, 'SKU-1769144617125-3-L', 394000.00, 472800.00, NULL, 84, 1, '2026-01-23 05:03:37.131', '2026-01-23 05:03:37.131', NULL, NULL, NULL, NULL, NULL),
	(36, 16, 'SKU-1769144617125-3-XL', 394000.00, 472800.00, NULL, 13, 1, '2026-01-23 05:03:37.132', '2026-01-23 05:03:37.132', NULL, NULL, NULL, NULL, NULL),
	(37, 17, 'SKU-1769144617133-4-S', 419000.00, 502800.00, NULL, 88, 1, '2026-01-23 05:03:37.137', '2026-01-23 05:03:37.137', NULL, NULL, NULL, NULL, NULL),
	(38, 17, 'SKU-1769144617133-4-M', 419000.00, 502800.00, NULL, 27, 1, '2026-01-23 05:03:37.138', '2026-01-23 05:03:37.138', NULL, NULL, NULL, NULL, NULL),
	(39, 17, 'SKU-1769144617133-4-L', 419000.00, 502800.00, NULL, 89, 1, '2026-01-23 05:03:37.139', '2026-01-23 05:03:37.139', NULL, NULL, NULL, NULL, NULL),
	(40, 17, 'SKU-1769144617133-4-XL', 419000.00, 502800.00, NULL, 57, 1, '2026-01-23 05:03:37.141', '2026-01-23 05:03:37.141', NULL, NULL, NULL, NULL, NULL),
	(41, 18, 'SKU-1769144617142-5-S', 161000.00, 193200.00, NULL, 19, 1, '2026-01-23 05:03:37.145', '2026-01-23 05:03:37.145', NULL, NULL, NULL, NULL, NULL),
	(42, 18, 'SKU-1769144617142-5-M', 161000.00, 193200.00, NULL, 36, 1, '2026-01-23 05:03:37.146', '2026-01-23 05:03:37.146', NULL, NULL, NULL, NULL, NULL),
	(43, 18, 'SKU-1769144617142-5-L', 161000.00, 193200.00, NULL, 30, 1, '2026-01-23 05:03:37.148', '2026-01-23 05:03:37.148', NULL, NULL, NULL, NULL, NULL),
	(44, 18, 'SKU-1769144617142-5-XL', 161000.00, 193200.00, NULL, 98, 1, '2026-01-23 05:03:37.149', '2026-01-23 05:03:37.149', NULL, NULL, NULL, NULL, NULL),
	(45, 19, 'SKU-1769144617149-6-S', 317000.00, 380400.00, NULL, 99, 1, '2026-01-23 05:03:37.152', '2026-01-23 05:03:37.152', NULL, NULL, NULL, NULL, NULL),
	(46, 19, 'SKU-1769144617149-6-M', 317000.00, 380400.00, NULL, 87, 1, '2026-01-23 05:03:37.153', '2026-01-23 05:03:37.153', NULL, NULL, NULL, NULL, NULL),
	(47, 19, 'SKU-1769144617149-6-L', 317000.00, 380400.00, NULL, 74, 1, '2026-01-23 05:03:37.154', '2026-01-23 05:03:37.154', NULL, NULL, NULL, NULL, NULL),
	(48, 19, 'SKU-1769144617149-6-XL', 317000.00, 380400.00, NULL, 67, 1, '2026-01-23 05:03:37.155', '2026-01-23 05:03:37.155', NULL, NULL, NULL, NULL, NULL),
	(49, 20, 'SKU-1769144617156-7-S', 261000.00, 313200.00, NULL, 38, 1, '2026-01-23 05:03:37.158', '2026-01-23 05:03:37.158', NULL, NULL, NULL, NULL, NULL),
	(50, 20, 'SKU-1769144617156-7-M', 261000.00, 313200.00, NULL, 85, 1, '2026-01-23 05:03:37.159', '2026-01-23 05:03:37.159', NULL, NULL, NULL, NULL, NULL),
	(51, 20, 'SKU-1769144617156-7-L', 261000.00, 313200.00, NULL, 60, 1, '2026-01-23 05:03:37.161', '2026-01-23 05:03:37.161', NULL, NULL, NULL, NULL, NULL),
	(52, 20, 'SKU-1769144617156-7-XL', 261000.00, 313200.00, NULL, 13, 1, '2026-01-23 05:03:37.162', '2026-01-23 05:03:37.162', NULL, NULL, NULL, NULL, NULL),
	(53, 21, 'SKU-1769144617163-8-S', 374000.00, 448800.00, NULL, 48, 1, '2026-01-23 05:03:37.165', '2026-01-23 05:03:37.165', NULL, NULL, NULL, NULL, NULL),
	(54, 21, 'SKU-1769144617163-8-M', 374000.00, 448800.00, NULL, 79, 1, '2026-01-23 05:03:37.166', '2026-01-23 05:03:37.166', NULL, NULL, NULL, NULL, NULL),
	(55, 21, 'SKU-1769144617163-8-L', 374000.00, 448800.00, NULL, 21, 1, '2026-01-23 05:03:37.167', '2026-01-23 05:03:37.167', NULL, NULL, NULL, NULL, NULL),
	(56, 21, 'SKU-1769144617163-8-XL', 374000.00, 448800.00, NULL, 44, 1, '2026-01-23 05:03:37.168', '2026-01-23 05:03:37.168', NULL, NULL, NULL, NULL, NULL),
	(57, 22, 'SKU-1769144617168-9-S', 464000.00, 556800.00, NULL, 66, 1, '2026-01-23 05:03:37.172', '2026-01-23 05:03:37.172', NULL, NULL, NULL, NULL, NULL),
	(58, 22, 'SKU-1769144617168-9-M', 464000.00, 556800.00, NULL, 29, 1, '2026-01-23 05:03:37.173', '2026-01-23 05:03:37.173', NULL, NULL, NULL, NULL, NULL),
	(59, 22, 'SKU-1769144617168-9-L', 464000.00, 556800.00, NULL, 75, 1, '2026-01-23 05:03:37.174', '2026-01-23 05:03:37.174', NULL, NULL, NULL, NULL, NULL),
	(60, 22, 'SKU-1769144617168-9-XL', 464000.00, 556800.00, NULL, 72, 1, '2026-01-23 05:03:37.175', '2026-01-23 05:03:37.175', NULL, NULL, NULL, NULL, NULL),
	(61, 23, 'SKU-1769144617176-10-S', 474000.00, 568800.00, NULL, 81, 1, '2026-01-23 05:03:37.178', '2026-01-23 05:03:37.178', NULL, NULL, NULL, NULL, NULL),
	(62, 23, 'SKU-1769144617176-10-M', 474000.00, 568800.00, NULL, 69, 1, '2026-01-23 05:03:37.179', '2026-01-23 05:03:37.179', NULL, NULL, NULL, NULL, NULL),
	(63, 23, 'SKU-1769144617176-10-L', 474000.00, 568800.00, NULL, 14, 1, '2026-01-23 05:03:37.180', '2026-01-23 05:03:37.180', NULL, NULL, NULL, NULL, NULL),
	(64, 23, 'SKU-1769144617176-10-XL', 474000.00, 568800.00, NULL, 70, 1, '2026-01-23 05:03:37.181', '2026-01-23 05:03:37.181', NULL, NULL, NULL, NULL, NULL),
	(65, 24, 'SKU-1769144617183-11-S', 295000.00, 354000.00, NULL, 85, 1, '2026-01-23 05:03:37.185', '2026-01-23 05:03:37.185', NULL, NULL, NULL, NULL, NULL),
	(66, 24, 'SKU-1769144617183-11-M', 295000.00, 354000.00, NULL, 44, 1, '2026-01-23 05:03:37.187', '2026-01-23 05:03:37.187', NULL, NULL, NULL, NULL, NULL),
	(67, 24, 'SKU-1769144617183-11-L', 295000.00, 354000.00, NULL, 59, 1, '2026-01-23 05:03:37.189', '2026-01-23 05:03:37.189', NULL, NULL, NULL, NULL, NULL),
	(68, 24, 'SKU-1769144617183-11-XL', 295000.00, 354000.00, NULL, 41, 1, '2026-01-23 05:03:37.191', '2026-01-23 05:03:37.191', NULL, NULL, NULL, NULL, NULL),
	(69, 25, 'SKU-1769144617191-12-S', 483000.00, 579600.00, NULL, 66, 1, '2026-01-23 05:03:37.196', '2026-01-23 05:03:37.196', NULL, NULL, NULL, NULL, NULL),
	(70, 25, 'SKU-1769144617191-12-M', 483000.00, 579600.00, NULL, 82, 1, '2026-01-23 05:03:37.198', '2026-01-23 05:03:37.198', NULL, NULL, NULL, NULL, NULL),
	(71, 25, 'SKU-1769144617191-12-L', 483000.00, 579600.00, NULL, 79, 1, '2026-01-23 05:03:37.199', '2026-01-23 05:03:37.199', NULL, NULL, NULL, NULL, NULL),
	(72, 25, 'SKU-1769144617191-12-XL', 483000.00, 579600.00, NULL, 97, 1, '2026-01-23 05:03:37.200', '2026-01-23 05:03:37.200', NULL, NULL, NULL, NULL, NULL),
	(73, 26, 'SKU-1769144617201-13-S', 305000.00, 366000.00, NULL, 18, 1, '2026-01-23 05:03:37.204', '2026-01-23 05:03:37.204', NULL, NULL, NULL, NULL, NULL),
	(74, 26, 'SKU-1769144617201-13-M', 305000.00, 366000.00, NULL, 19, 1, '2026-01-23 05:03:37.205', '2026-01-23 05:03:37.205', NULL, NULL, NULL, NULL, NULL),
	(75, 26, 'SKU-1769144617201-13-L', 305000.00, 366000.00, NULL, 35, 1, '2026-01-23 05:03:37.206', '2026-01-23 05:03:37.206', NULL, NULL, NULL, NULL, NULL),
	(76, 26, 'SKU-1769144617201-13-XL', 305000.00, 366000.00, NULL, 91, 1, '2026-01-23 05:03:37.207', '2026-01-23 05:03:37.207', NULL, NULL, NULL, NULL, NULL),
	(77, 27, 'SKU-1769144617208-14-S', 378000.00, 453600.00, NULL, 50, 1, '2026-01-23 05:03:37.210', '2026-01-23 05:03:37.210', NULL, NULL, NULL, NULL, NULL),
	(78, 27, 'SKU-1769144617208-14-M', 378000.00, 453600.00, NULL, 30, 1, '2026-01-23 05:03:37.212', '2026-01-23 05:03:37.212', NULL, NULL, NULL, NULL, NULL),
	(79, 27, 'SKU-1769144617208-14-L', 378000.00, 453600.00, NULL, 12, 1, '2026-01-23 05:03:37.213', '2026-01-23 05:03:37.213', NULL, NULL, NULL, NULL, NULL),
	(80, 27, 'SKU-1769144617208-14-XL', 378000.00, 453600.00, NULL, 91, 1, '2026-01-23 05:03:37.215', '2026-01-23 05:03:37.215', NULL, NULL, NULL, NULL, NULL),
	(81, 28, 'SKU-1769144617216-15-S', 54000.00, 64800.00, NULL, 9, 1, '2026-01-23 05:03:37.219', '2026-01-26 04:20:36.136', NULL, NULL, NULL, NULL, NULL),
	(82, 28, 'SKU-1769144617216-15-M', 54000.00, 64800.00, NULL, 65, 1, '2026-01-23 05:03:37.220', '2026-01-23 05:03:37.220', NULL, NULL, NULL, NULL, NULL),
	(83, 28, 'SKU-1769144617216-15-L', 54000.00, 64800.00, NULL, 23, 1, '2026-01-23 05:03:37.221', '2026-01-23 05:03:37.221', NULL, NULL, NULL, NULL, NULL),
	(84, 28, 'SKU-1769144617216-15-XL', 54000.00, 64800.00, NULL, 96, 1, '2026-01-23 05:03:37.223', '2026-01-23 05:03:37.223', NULL, NULL, NULL, NULL, NULL),
	(85, 29, 'SKU-1769144617224-16-S', 74000.00, 88800.00, NULL, 88, 1, '2026-01-23 05:03:37.227', '2026-01-23 05:03:37.227', NULL, NULL, NULL, NULL, NULL),
	(86, 29, 'SKU-1769144617224-16-M', 74000.00, 88800.00, NULL, 86, 1, '2026-01-23 05:03:37.228', '2026-01-23 05:03:37.228', NULL, NULL, NULL, NULL, NULL),
	(87, 29, 'SKU-1769144617224-16-L', 74000.00, 88800.00, NULL, 66, 1, '2026-01-23 05:03:37.229', '2026-01-23 05:03:37.229', NULL, NULL, NULL, NULL, NULL),
	(88, 29, 'SKU-1769144617224-16-XL', 74000.00, 88800.00, NULL, 10, 1, '2026-01-23 05:03:37.231', '2026-01-23 05:03:37.231', NULL, NULL, NULL, NULL, NULL),
	(89, 30, 'SKU-1769144617231-17-S', 448000.00, 537600.00, NULL, 94, 1, '2026-01-23 05:03:37.234', '2026-01-23 05:03:37.234', NULL, NULL, NULL, NULL, NULL),
	(90, 30, 'SKU-1769144617231-17-M', 448000.00, 537600.00, NULL, 54, 1, '2026-01-23 05:03:37.236', '2026-01-23 05:03:37.236', NULL, NULL, NULL, NULL, NULL),
	(91, 30, 'SKU-1769144617231-17-L', 448000.00, 537600.00, NULL, 24, 1, '2026-01-23 05:03:37.237', '2026-01-23 05:03:37.237', NULL, NULL, NULL, NULL, NULL),
	(92, 30, 'SKU-1769144617231-17-XL', 448000.00, 537600.00, NULL, 85, 1, '2026-01-23 05:03:37.239', '2026-01-23 05:03:37.239', NULL, NULL, NULL, NULL, NULL),
	(93, 31, 'SKU-1769144617239-18-S', 174000.00, 208800.00, NULL, 16, 1, '2026-01-23 05:03:37.242', '2026-01-23 05:03:37.242', NULL, NULL, NULL, NULL, NULL),
	(94, 31, 'SKU-1769144617239-18-M', 174000.00, 208800.00, NULL, 48, 1, '2026-01-23 05:03:37.243', '2026-01-23 05:03:37.243', NULL, NULL, NULL, NULL, NULL),
	(95, 31, 'SKU-1769144617239-18-L', 174000.00, 208800.00, NULL, 44, 1, '2026-01-23 05:03:37.245', '2026-01-23 05:03:37.245', NULL, NULL, NULL, NULL, NULL),
	(96, 31, 'SKU-1769144617239-18-XL', 174000.00, 208800.00, NULL, 81, 1, '2026-01-23 05:03:37.247', '2026-01-23 05:03:37.247', NULL, NULL, NULL, NULL, NULL),
	(97, 32, 'SKU-1769144617247-19-S', 211000.00, 253200.00, NULL, 20, 1, '2026-01-23 05:03:37.252', '2026-01-23 05:03:37.252', NULL, NULL, NULL, NULL, NULL),
	(98, 32, 'SKU-1769144617247-19-M', 211000.00, 253200.00, NULL, 35, 1, '2026-01-23 05:03:37.254', '2026-01-23 05:03:37.254', NULL, NULL, NULL, NULL, NULL),
	(99, 32, 'SKU-1769144617247-19-L', 211000.00, 253200.00, NULL, 82, 1, '2026-01-23 05:03:37.256', '2026-01-23 05:03:37.256', NULL, NULL, NULL, NULL, NULL),
	(100, 32, 'SKU-1769144617247-19-XL', 211000.00, 253200.00, NULL, 75, 1, '2026-01-23 05:03:37.257', '2026-01-23 05:03:37.257', NULL, NULL, NULL, NULL, NULL),
	(101, 33, 'SKU-1769144617258-20-S', 68000.00, 81600.00, NULL, 65, 1, '2026-01-23 05:03:37.260', '2026-01-23 05:03:37.260', NULL, NULL, NULL, NULL, NULL),
	(102, 33, 'SKU-1769144617258-20-M', 68000.00, 81600.00, NULL, 29, 1, '2026-01-23 05:03:37.261', '2026-01-23 05:03:37.261', NULL, NULL, NULL, NULL, NULL),
	(103, 33, 'SKU-1769144617258-20-L', 68000.00, 81600.00, NULL, 79, 1, '2026-01-23 05:03:37.262', '2026-01-23 05:03:37.262', NULL, NULL, NULL, NULL, NULL),
	(104, 33, 'SKU-1769144617258-20-XL', 68000.00, 81600.00, NULL, 27, 1, '2026-01-23 05:03:37.264', '2026-01-23 05:03:37.264', NULL, NULL, NULL, NULL, NULL),
	(105, 34, 'SKU-1769144617264-21-S', 335000.00, 402000.00, NULL, 14, 1, '2026-01-23 05:03:37.268', '2026-01-23 05:03:37.268', NULL, NULL, NULL, NULL, NULL),
	(106, 34, 'SKU-1769144617264-21-M', 335000.00, 402000.00, NULL, 30, 1, '2026-01-23 05:03:37.269', '2026-01-23 05:03:37.269', NULL, NULL, NULL, NULL, NULL),
	(107, 34, 'SKU-1769144617264-21-L', 335000.00, 402000.00, NULL, 79, 1, '2026-01-23 05:03:37.270', '2026-01-23 05:03:37.270', NULL, NULL, NULL, NULL, NULL),
	(108, 34, 'SKU-1769144617264-21-XL', 335000.00, 402000.00, NULL, 63, 1, '2026-01-23 05:03:37.271', '2026-01-23 05:03:37.271', NULL, NULL, NULL, NULL, NULL),
	(109, 35, 'SKU-1769144617272-22-S', 313000.00, 375600.00, NULL, 12, 1, '2026-01-23 05:03:37.275', '2026-01-23 05:03:37.275', NULL, NULL, NULL, NULL, NULL),
	(110, 35, 'SKU-1769144617272-22-M', 313000.00, 375600.00, NULL, 47, 1, '2026-01-23 05:03:37.276', '2026-01-23 05:03:37.276', NULL, NULL, NULL, NULL, NULL),
	(111, 35, 'SKU-1769144617272-22-L', 313000.00, 375600.00, NULL, 74, 1, '2026-01-23 05:03:37.278', '2026-01-23 05:03:37.278', NULL, NULL, NULL, NULL, NULL),
	(112, 35, 'SKU-1769144617272-22-XL', 313000.00, 375600.00, NULL, 43, 1, '2026-01-23 05:03:37.279', '2026-01-23 05:03:37.279', NULL, NULL, NULL, NULL, NULL),
	(113, 36, 'SKU-1769144617280-23-S', 428000.00, 513600.00, NULL, 68, 1, '2026-01-23 05:03:37.283', '2026-01-23 05:03:37.283', NULL, NULL, NULL, NULL, NULL),
	(114, 36, 'SKU-1769144617280-23-M', 428000.00, 513600.00, NULL, 19, 1, '2026-01-23 05:03:37.285', '2026-01-23 05:03:37.285', NULL, NULL, NULL, NULL, NULL),
	(115, 36, 'SKU-1769144617280-23-L', 428000.00, 513600.00, NULL, 52, 1, '2026-01-23 05:03:37.286', '2026-01-23 05:03:37.286', NULL, NULL, NULL, NULL, NULL),
	(116, 36, 'SKU-1769144617280-23-XL', 428000.00, 513600.00, NULL, 31, 1, '2026-01-23 05:03:37.287', '2026-01-23 05:03:37.287', NULL, NULL, NULL, NULL, NULL),
	(117, 37, 'SKU-1769144617288-24-S', 219000.00, 262800.00, NULL, 57, 1, '2026-01-23 05:03:37.290', '2026-01-23 05:03:37.290', NULL, NULL, NULL, NULL, NULL),
	(118, 37, 'SKU-1769144617288-24-M', 219000.00, 262800.00, NULL, 28, 1, '2026-01-23 05:03:37.291', '2026-01-23 05:03:37.291', NULL, NULL, NULL, NULL, NULL),
	(119, 37, 'SKU-1769144617288-24-L', 219000.00, 262800.00, NULL, 83, 1, '2026-01-23 05:03:37.292', '2026-01-23 05:03:37.292', NULL, NULL, NULL, NULL, NULL),
	(120, 37, 'SKU-1769144617288-24-XL', 219000.00, 262800.00, NULL, 98, 1, '2026-01-23 05:03:37.293', '2026-01-23 05:03:37.293', NULL, NULL, NULL, NULL, NULL),
	(121, 38, 'SKU-1769144617294-25-S', 276000.00, 331200.00, NULL, 45, 1, '2026-01-23 05:03:37.296', '2026-01-23 05:03:37.296', NULL, NULL, NULL, NULL, NULL),
	(122, 38, 'SKU-1769144617294-25-M', 276000.00, 331200.00, NULL, 82, 1, '2026-01-23 05:03:37.298', '2026-01-23 05:03:37.298', NULL, NULL, NULL, NULL, NULL),
	(123, 38, 'SKU-1769144617294-25-L', 276000.00, 331200.00, NULL, 22, 1, '2026-01-23 05:03:37.299', '2026-01-23 05:03:37.299', NULL, NULL, NULL, NULL, NULL),
	(124, 38, 'SKU-1769144617294-25-XL', 276000.00, 331200.00, NULL, 32, 1, '2026-01-23 05:03:37.300', '2026-01-23 05:03:37.300', NULL, NULL, NULL, NULL, NULL),
	(125, 39, 'SKU-1769144617301-26-S', 475000.00, 570000.00, NULL, 11, 1, '2026-01-23 05:03:37.303', '2026-01-23 05:03:37.303', NULL, NULL, NULL, NULL, NULL),
	(126, 39, 'SKU-1769144617301-26-M', 475000.00, 570000.00, NULL, 44, 1, '2026-01-23 05:03:37.304', '2026-01-23 05:03:37.304', NULL, NULL, NULL, NULL, NULL),
	(127, 39, 'SKU-1769144617301-26-L', 475000.00, 570000.00, NULL, 92, 1, '2026-01-23 05:03:37.305', '2026-01-23 05:03:37.305', NULL, NULL, NULL, NULL, NULL),
	(128, 39, 'SKU-1769144617301-26-XL', 475000.00, 570000.00, NULL, 86, 1, '2026-01-23 05:03:37.306', '2026-01-23 05:03:37.306', NULL, NULL, NULL, NULL, NULL),
	(129, 40, 'SKU-1769144617307-27-S', 331000.00, 397200.00, NULL, 15, 1, '2026-01-23 05:03:37.309', '2026-01-23 05:03:37.309', NULL, NULL, NULL, NULL, NULL),
	(130, 40, 'SKU-1769144617307-27-M', 331000.00, 397200.00, NULL, 65, 1, '2026-01-23 05:03:37.310', '2026-01-23 05:03:37.310', NULL, NULL, NULL, NULL, NULL),
	(131, 40, 'SKU-1769144617307-27-L', 331000.00, 397200.00, NULL, 42, 1, '2026-01-23 05:03:37.311', '2026-01-23 05:03:37.311', NULL, NULL, NULL, NULL, NULL),
	(132, 40, 'SKU-1769144617307-27-XL', 331000.00, 397200.00, NULL, 44, 1, '2026-01-23 05:03:37.312', '2026-01-23 05:03:37.312', NULL, NULL, NULL, NULL, NULL),
	(133, 41, 'SKU-1769144617313-28-S', 117000.00, 140400.00, NULL, 91, 1, '2026-01-23 05:03:37.315', '2026-01-23 05:03:37.315', NULL, NULL, NULL, NULL, NULL),
	(134, 41, 'SKU-1769144617313-28-M', 117000.00, 140400.00, NULL, 26, 1, '2026-01-23 05:03:37.316', '2026-01-23 05:03:37.316', NULL, NULL, NULL, NULL, NULL),
	(135, 41, 'SKU-1769144617313-28-L', 117000.00, 140400.00, NULL, 67, 1, '2026-01-23 05:03:37.317', '2026-01-23 05:03:37.317', NULL, NULL, NULL, NULL, NULL),
	(136, 41, 'SKU-1769144617313-28-XL', 117000.00, 140400.00, NULL, 81, 1, '2026-01-23 05:03:37.318', '2026-01-23 05:03:37.318', NULL, NULL, NULL, NULL, NULL),
	(137, 42, 'SKU-1769144617319-29-S', 158000.00, 189600.00, NULL, 33, 1, '2026-01-23 05:03:37.321', '2026-01-23 05:03:37.321', NULL, NULL, NULL, NULL, NULL),
	(138, 42, 'SKU-1769144617319-29-M', 158000.00, 189600.00, NULL, 95, 1, '2026-01-23 05:03:37.323', '2026-01-23 05:03:37.323', NULL, NULL, NULL, NULL, NULL),
	(139, 42, 'SKU-1769144617319-29-L', 158000.00, 189600.00, NULL, 28, 1, '2026-01-23 05:03:37.324', '2026-01-23 05:03:37.324', NULL, NULL, NULL, NULL, NULL),
	(140, 42, 'SKU-1769144617319-29-XL', 158000.00, 189600.00, NULL, 26, 1, '2026-01-23 05:03:37.325', '2026-01-23 05:03:37.325', NULL, NULL, NULL, NULL, NULL),
	(141, 43, 'SKU-1769144617325-30-S', 329000.00, 394800.00, NULL, 69, 1, '2026-01-23 05:03:37.327', '2026-01-23 05:03:37.327', NULL, NULL, NULL, NULL, NULL),
	(142, 43, 'SKU-1769144617325-30-M', 329000.00, 394800.00, NULL, 63, 1, '2026-01-23 05:03:37.329', '2026-01-23 05:03:37.329', NULL, NULL, NULL, NULL, NULL),
	(143, 43, 'SKU-1769144617325-30-L', 329000.00, 394800.00, NULL, 75, 1, '2026-01-23 05:03:37.330', '2026-01-23 05:03:37.330', NULL, NULL, NULL, NULL, NULL),
	(144, 43, 'SKU-1769144617325-30-XL', 329000.00, 394800.00, NULL, 21, 1, '2026-01-23 05:03:37.331', '2026-01-23 05:03:37.331', NULL, NULL, NULL, NULL, NULL),
	(145, 44, 'SKU-1769144617331-31-S', 260000.00, 312000.00, NULL, 10, 1, '2026-01-23 05:03:37.333', '2026-01-23 05:03:37.333', NULL, NULL, NULL, NULL, NULL),
	(146, 44, 'SKU-1769144617331-31-M', 260000.00, 312000.00, NULL, 47, 1, '2026-01-23 05:03:37.334', '2026-01-23 05:03:37.334', NULL, NULL, NULL, NULL, NULL),
	(147, 44, 'SKU-1769144617331-31-L', 260000.00, 312000.00, NULL, 94, 1, '2026-01-23 05:03:37.335', '2026-01-23 05:03:37.335', NULL, NULL, NULL, NULL, NULL),
	(148, 44, 'SKU-1769144617331-31-XL', 260000.00, 312000.00, NULL, 96, 1, '2026-01-23 05:03:37.336', '2026-01-23 05:03:37.336', NULL, NULL, NULL, NULL, NULL),
	(149, 45, 'SKU-1769144617337-32-S', 398000.00, 477600.00, NULL, 55, 1, '2026-01-23 05:03:37.339', '2026-01-23 05:03:37.339', NULL, NULL, NULL, NULL, NULL),
	(150, 45, 'SKU-1769144617337-32-M', 398000.00, 477600.00, NULL, 50, 1, '2026-01-23 05:03:37.340', '2026-01-23 05:03:37.340', NULL, NULL, NULL, NULL, NULL),
	(151, 45, 'SKU-1769144617337-32-L', 398000.00, 477600.00, NULL, 100, 1, '2026-01-23 05:03:37.341', '2026-01-23 05:03:37.341', NULL, NULL, NULL, NULL, NULL),
	(152, 45, 'SKU-1769144617337-32-XL', 398000.00, 477600.00, NULL, 85, 1, '2026-01-23 05:03:37.342', '2026-01-23 05:03:37.342', NULL, NULL, NULL, NULL, NULL),
	(153, 46, 'SKU-1769144617343-33-S', 475000.00, 570000.00, NULL, 69, 1, '2026-01-23 05:03:37.346', '2026-01-23 05:03:37.346', NULL, NULL, NULL, NULL, NULL),
	(154, 46, 'SKU-1769144617343-33-M', 475000.00, 570000.00, NULL, 82, 1, '2026-01-23 05:03:37.348', '2026-01-23 05:03:37.348', NULL, NULL, NULL, NULL, NULL),
	(155, 46, 'SKU-1769144617343-33-L', 475000.00, 570000.00, NULL, 17, 1, '2026-01-23 05:03:37.349', '2026-01-23 05:03:37.349', NULL, NULL, NULL, NULL, NULL),
	(156, 46, 'SKU-1769144617343-33-XL', 475000.00, 570000.00, NULL, 88, 1, '2026-01-23 05:03:37.350', '2026-01-23 05:03:37.350', NULL, NULL, NULL, NULL, NULL),
	(157, 47, 'SKU-1769144617351-34-S', 420000.00, 504000.00, NULL, 89, 1, '2026-01-23 05:03:37.353', '2026-01-23 05:03:37.353', NULL, NULL, NULL, NULL, NULL),
	(158, 47, 'SKU-1769144617351-34-M', 420000.00, 504000.00, NULL, 38, 1, '2026-01-23 05:03:37.354', '2026-01-23 05:03:37.354', NULL, NULL, NULL, NULL, NULL),
	(159, 47, 'SKU-1769144617351-34-L', 420000.00, 504000.00, NULL, 31, 1, '2026-01-23 05:03:37.355', '2026-01-23 05:03:37.355', NULL, NULL, NULL, NULL, NULL),
	(160, 47, 'SKU-1769144617351-34-XL', 420000.00, 504000.00, NULL, 53, 1, '2026-01-23 05:03:37.356', '2026-01-23 05:03:37.356', NULL, NULL, NULL, NULL, NULL),
	(161, 48, 'SKU-1769144617357-35-S', 74000.00, 88800.00, NULL, 56, 1, '2026-01-23 05:03:37.359', '2026-01-23 05:03:37.359', NULL, NULL, NULL, NULL, NULL),
	(162, 48, 'SKU-1769144617357-35-M', 74000.00, 88800.00, NULL, 59, 1, '2026-01-23 05:03:37.361', '2026-01-23 05:03:37.361', NULL, NULL, NULL, NULL, NULL),
	(163, 48, 'SKU-1769144617357-35-L', 74000.00, 88800.00, NULL, 99, 1, '2026-01-23 05:03:37.362', '2026-01-23 05:03:37.362', NULL, NULL, NULL, NULL, NULL),
	(164, 48, 'SKU-1769144617357-35-XL', 74000.00, 88800.00, NULL, 21, 1, '2026-01-23 05:03:37.363', '2026-01-23 05:03:37.363', NULL, NULL, NULL, NULL, NULL),
	(165, 49, 'SKU-1769144617363-36-S', 180000.00, 216000.00, NULL, 82, 1, '2026-01-23 05:03:37.365', '2026-01-23 05:03:37.365', NULL, NULL, NULL, NULL, NULL),
	(166, 49, 'SKU-1769144617363-36-M', 180000.00, 216000.00, NULL, 12, 1, '2026-01-23 05:03:37.366', '2026-01-23 05:03:37.366', NULL, NULL, NULL, NULL, NULL),
	(167, 49, 'SKU-1769144617363-36-L', 180000.00, 216000.00, NULL, 70, 1, '2026-01-23 05:03:37.367', '2026-01-23 05:03:37.367', NULL, NULL, NULL, NULL, NULL),
	(168, 49, 'SKU-1769144617363-36-XL', 180000.00, 216000.00, NULL, 99, 1, '2026-01-23 05:03:37.368', '2026-01-23 05:03:37.368', NULL, NULL, NULL, NULL, NULL),
	(169, 50, 'SKU-1769144617368-37-S', 282000.00, 338400.00, NULL, 96, 1, '2026-01-23 05:03:37.370', '2026-01-23 05:03:37.370', NULL, NULL, NULL, NULL, NULL),
	(170, 50, 'SKU-1769144617368-37-M', 282000.00, 338400.00, NULL, 55, 1, '2026-01-23 05:03:37.371', '2026-01-23 05:03:37.371', NULL, NULL, NULL, NULL, NULL),
	(171, 50, 'SKU-1769144617368-37-L', 282000.00, 338400.00, NULL, 83, 1, '2026-01-23 05:03:37.372', '2026-01-23 05:03:37.372', NULL, NULL, NULL, NULL, NULL),
	(172, 50, 'SKU-1769144617368-37-XL', 282000.00, 338400.00, NULL, 59, 1, '2026-01-23 05:03:37.373', '2026-01-23 05:03:37.373', NULL, NULL, NULL, NULL, NULL),
	(173, 51, 'SKU-1769144617377-38-S', 112000.00, 134400.00, NULL, 67, 1, '2026-01-23 05:03:37.380', '2026-01-23 05:03:37.380', NULL, NULL, NULL, NULL, NULL),
	(174, 51, 'SKU-1769144617377-38-M', 112000.00, 134400.00, NULL, 45, 1, '2026-01-23 05:03:37.381', '2026-01-23 05:03:37.381', NULL, NULL, NULL, NULL, NULL),
	(175, 51, 'SKU-1769144617377-38-L', 112000.00, 134400.00, NULL, 75, 1, '2026-01-23 05:03:37.382', '2026-01-23 05:03:37.382', NULL, NULL, NULL, NULL, NULL),
	(176, 51, 'SKU-1769144617377-38-XL', 112000.00, 134400.00, NULL, 89, 1, '2026-01-23 05:03:37.384', '2026-01-23 05:03:37.384', NULL, NULL, NULL, NULL, NULL),
	(177, 52, 'SKU-1769144617384-39-S', 62000.00, 74400.00, NULL, 87, 1, '2026-01-23 05:03:37.386', '2026-01-23 05:03:37.386', NULL, NULL, NULL, NULL, NULL),
	(178, 52, 'SKU-1769144617384-39-M', 62000.00, 74400.00, NULL, 65, 1, '2026-01-23 05:03:37.387', '2026-01-23 05:03:37.387', NULL, NULL, NULL, NULL, NULL),
	(179, 52, 'SKU-1769144617384-39-L', 62000.00, 74400.00, NULL, 20, 1, '2026-01-23 05:03:37.388', '2026-01-23 05:03:37.388', NULL, NULL, NULL, NULL, NULL),
	(180, 52, 'SKU-1769144617384-39-XL', 62000.00, 74400.00, NULL, 83, 1, '2026-01-23 05:03:37.390', '2026-01-23 05:03:37.390', NULL, NULL, NULL, NULL, NULL),
	(181, 53, 'SKU-1769144617390-40-S', 286000.00, 343200.00, NULL, 40, 1, '2026-01-23 05:03:37.393', '2026-01-23 05:03:37.393', NULL, NULL, NULL, NULL, NULL),
	(182, 53, 'SKU-1769144617390-40-M', 286000.00, 343200.00, NULL, 87, 1, '2026-01-23 05:03:37.394', '2026-01-23 05:03:37.394', NULL, NULL, NULL, NULL, NULL),
	(183, 53, 'SKU-1769144617390-40-L', 286000.00, 343200.00, NULL, 55, 1, '2026-01-23 05:03:37.395', '2026-01-23 05:03:37.395', NULL, NULL, NULL, NULL, NULL),
	(184, 53, 'SKU-1769144617390-40-XL', 286000.00, 343200.00, NULL, 54, 1, '2026-01-23 05:03:37.396', '2026-01-23 05:03:37.396', NULL, NULL, NULL, NULL, NULL),
	(185, 54, 'SKU-1769144617397-41-S', 164000.00, 196800.00, NULL, 39, 1, '2026-01-23 05:03:37.399', '2026-01-23 05:03:37.399', NULL, NULL, NULL, NULL, NULL),
	(186, 54, 'SKU-1769144617397-41-M', 164000.00, 196800.00, NULL, 20, 1, '2026-01-23 05:03:37.401', '2026-01-23 05:03:37.401', NULL, NULL, NULL, NULL, NULL),
	(187, 54, 'SKU-1769144617397-41-L', 164000.00, 196800.00, NULL, 92, 1, '2026-01-23 05:03:37.402', '2026-01-23 05:03:37.402', NULL, NULL, NULL, NULL, NULL),
	(188, 54, 'SKU-1769144617397-41-XL', 164000.00, 196800.00, NULL, 35, 1, '2026-01-23 05:03:37.403', '2026-01-23 05:03:37.403', NULL, NULL, NULL, NULL, NULL),
	(189, 55, 'SKU-1769144617404-42-S', 384000.00, 460800.00, NULL, 60, 1, '2026-01-23 05:03:37.406', '2026-01-23 05:03:37.406', NULL, NULL, NULL, NULL, NULL),
	(190, 55, 'SKU-1769144617404-42-M', 384000.00, 460800.00, NULL, 92, 1, '2026-01-23 05:03:37.407', '2026-01-23 05:03:37.407', NULL, NULL, NULL, NULL, NULL),
	(191, 55, 'SKU-1769144617404-42-L', 384000.00, 460800.00, NULL, 24, 1, '2026-01-23 05:03:37.408', '2026-01-23 05:03:37.408', NULL, NULL, NULL, NULL, NULL),
	(192, 55, 'SKU-1769144617404-42-XL', 384000.00, 460800.00, NULL, 99, 1, '2026-01-23 05:03:37.409', '2026-01-23 05:03:37.409', NULL, NULL, NULL, NULL, NULL),
	(193, 56, 'SKU-1769144617410-43-S', 350000.00, 420000.00, NULL, 55, 1, '2026-01-23 05:03:37.412', '2026-01-23 05:03:37.412', NULL, NULL, NULL, NULL, NULL),
	(194, 56, 'SKU-1769144617410-43-M', 350000.00, 420000.00, NULL, 31, 1, '2026-01-23 05:03:37.413', '2026-01-23 05:03:37.413', NULL, NULL, NULL, NULL, NULL),
	(195, 56, 'SKU-1769144617410-43-L', 350000.00, 420000.00, NULL, 25, 1, '2026-01-23 05:03:37.414', '2026-01-23 05:03:37.414', NULL, NULL, NULL, NULL, NULL),
	(196, 56, 'SKU-1769144617410-43-XL', 350000.00, 420000.00, NULL, 81, 1, '2026-01-23 05:03:37.416', '2026-01-23 05:03:37.416', NULL, NULL, NULL, NULL, NULL),
	(197, 57, 'SKU-1769144617416-44-S', 383000.00, 459600.00, NULL, 61, 1, '2026-01-23 05:03:37.418', '2026-01-23 05:03:37.418', NULL, NULL, NULL, NULL, NULL),
	(198, 57, 'SKU-1769144617416-44-M', 383000.00, 459600.00, NULL, 49, 1, '2026-01-23 05:03:37.419', '2026-01-23 05:03:37.419', NULL, NULL, NULL, NULL, NULL),
	(199, 57, 'SKU-1769144617416-44-L', 383000.00, 459600.00, NULL, 75, 1, '2026-01-23 05:03:37.420', '2026-01-23 05:03:37.420', NULL, NULL, NULL, NULL, NULL),
	(200, 57, 'SKU-1769144617416-44-XL', 383000.00, 459600.00, NULL, 60, 1, '2026-01-23 05:03:37.421', '2026-01-23 05:03:37.421', NULL, NULL, NULL, NULL, NULL),
	(201, 58, 'SKU-1769144617422-45-S', 484000.00, 580800.00, NULL, 53, 1, '2026-01-23 05:03:37.423', '2026-01-23 05:03:37.423', NULL, NULL, NULL, NULL, NULL),
	(202, 58, 'SKU-1769144617422-45-M', 484000.00, 580800.00, NULL, 57, 1, '2026-01-23 05:03:37.425', '2026-01-23 05:03:37.425', NULL, NULL, NULL, NULL, NULL),
	(203, 58, 'SKU-1769144617422-45-L', 484000.00, 580800.00, NULL, 26, 1, '2026-01-23 05:03:37.426', '2026-01-23 05:03:37.426', NULL, NULL, NULL, NULL, NULL),
	(204, 58, 'SKU-1769144617422-45-XL', 484000.00, 580800.00, NULL, 30, 1, '2026-01-23 05:03:37.427', '2026-01-23 05:03:37.427', NULL, NULL, NULL, NULL, NULL),
	(205, 59, 'SKU-1769144617428-46-S', 416000.00, 499200.00, NULL, 35, 1, '2026-01-23 05:03:37.430', '2026-01-23 05:03:37.430', NULL, NULL, NULL, NULL, NULL),
	(206, 59, 'SKU-1769144617428-46-M', 416000.00, 499200.00, NULL, 35, 1, '2026-01-23 05:03:37.431', '2026-01-23 05:03:37.431', NULL, NULL, NULL, NULL, NULL),
	(207, 59, 'SKU-1769144617428-46-L', 416000.00, 499200.00, NULL, 14, 1, '2026-01-23 05:03:37.432', '2026-01-23 05:03:37.432', NULL, NULL, NULL, NULL, NULL),
	(208, 59, 'SKU-1769144617428-46-XL', 416000.00, 499200.00, NULL, 23, 1, '2026-01-23 05:03:37.433', '2026-01-23 05:03:37.433', NULL, NULL, NULL, NULL, NULL),
	(209, 60, 'SKU-1769144617433-47-S', 70000.00, 84000.00, NULL, 16, 1, '2026-01-23 05:03:37.435', '2026-01-23 05:03:37.435', NULL, NULL, NULL, NULL, NULL),
	(210, 60, 'SKU-1769144617433-47-M', 70000.00, 84000.00, NULL, 62, 1, '2026-01-23 05:03:37.436', '2026-01-23 05:03:37.436', NULL, NULL, NULL, NULL, NULL),
	(211, 60, 'SKU-1769144617433-47-L', 70000.00, 84000.00, NULL, 71, 1, '2026-01-23 05:03:37.437', '2026-01-23 05:03:37.437', NULL, NULL, NULL, NULL, NULL),
	(212, 60, 'SKU-1769144617433-47-XL', 70000.00, 84000.00, NULL, 21, 1, '2026-01-23 05:03:37.437', '2026-01-23 05:03:37.437', NULL, NULL, NULL, NULL, NULL),
	(213, 61, 'SKU-1769144617438-48-S', 435000.00, 522000.00, NULL, 93, 1, '2026-01-23 05:03:37.441', '2026-01-23 05:03:37.441', NULL, NULL, NULL, NULL, NULL),
	(214, 61, 'SKU-1769144617438-48-M', 435000.00, 522000.00, NULL, 63, 1, '2026-01-23 05:03:37.443', '2026-01-23 05:03:37.443', NULL, NULL, NULL, NULL, NULL),
	(215, 61, 'SKU-1769144617438-48-L', 435000.00, 522000.00, NULL, 38, 1, '2026-01-23 05:03:37.444', '2026-01-23 05:03:37.444', NULL, NULL, NULL, NULL, NULL),
	(216, 61, 'SKU-1769144617438-48-XL', 435000.00, 522000.00, NULL, 41, 1, '2026-01-23 05:03:37.445', '2026-01-23 05:03:37.445', NULL, NULL, NULL, NULL, NULL),
	(217, 62, 'SKU-1769144617446-49-S', 183000.00, 219600.00, NULL, 40, 1, '2026-01-23 05:03:37.448', '2026-01-23 05:03:37.448', NULL, NULL, NULL, NULL, NULL),
	(218, 62, 'SKU-1769144617446-49-M', 183000.00, 219600.00, NULL, 49, 1, '2026-01-23 05:03:37.449', '2026-01-23 05:03:37.449', NULL, NULL, NULL, NULL, NULL),
	(219, 62, 'SKU-1769144617446-49-L', 183000.00, 219600.00, NULL, 100, 1, '2026-01-23 05:03:37.450', '2026-01-23 05:03:37.450', NULL, NULL, NULL, NULL, NULL),
	(220, 62, 'SKU-1769144617446-49-XL', 183000.00, 219600.00, NULL, 66, 1, '2026-01-23 05:03:37.451', '2026-01-23 05:03:37.451', NULL, NULL, NULL, NULL, NULL);

-- Dumping structure for table fashion_store.settings
CREATE TABLE IF NOT EXISTS `settings` (
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.settings: ~8 rows (approximately)
INSERT INTO `settings` (`key`, `value`, `updated_at`) VALUES
	('legal_entity_name', '', '2026-01-23 14:51:09.000'),
	('maintenance_mode', 'false', '2026-01-23 14:51:09.000'),
	('physical_address', '', '2026-01-23 14:51:09.000'),
	('seo_indexing', 'false', '2026-01-23 14:51:09.000'),
	('store_logo', '/uploads/logo-1769154570250-339825401.jpg', '2026-01-23 14:51:09.000'),
	('store_name', 'Fashion Store', '2026-01-23 14:51:09.000'),
	('support_email', 'FashionStore@gmail.com', '2026-01-23 14:51:09.000'),
	('support_phone', '0935818000', '2026-01-23 14:51:09.000');

-- Dumping structure for table fashion_store.shipments
CREATE TABLE IF NOT EXISTS `shipments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `carrier` varchar(100) DEFAULT NULL,
  `tracking_code` varchar(120) DEFAULT NULL,
  `status` enum('pending','shipping','delivered','returned','cancelled') NOT NULL DEFAULT 'pending',
  `shipped_at` datetime(3) DEFAULT NULL,
  `delivered_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `shipments_order_id_key` (`order_id`),
  CONSTRAINT `shipments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.shipments: ~5 rows (approximately)
INSERT INTO `shipments` (`id`, `order_id`, `carrier`, `tracking_code`, `status`, `shipped_at`, `delivered_at`, `created_at`) VALUES
	(4, 122, NULL, NULL, 'pending', NULL, NULL, '2026-01-23 16:55:08.737'),
	(5, 123, NULL, NULL, 'pending', NULL, NULL, '2026-01-26 03:54:22.044'),
	(6, 124, NULL, NULL, 'pending', NULL, NULL, '2026-01-26 04:20:36.144'),
	(7, 125, NULL, NULL, 'delivered', NULL, '2026-01-29 09:30:41.418', '2026-01-27 08:08:39.775'),
	(8, 126, NULL, NULL, 'shipping', '2026-01-29 06:55:38.065', NULL, '2026-01-29 06:53:36.750');

-- Dumping structure for table fashion_store.shipping_addresses
CREATE TABLE IF NOT EXISTS `shipping_addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(120) NOT NULL,
  `province` varchar(120) NOT NULL,
  `country` varchar(50) NOT NULL DEFAULT 'VN',
  `postal_code` varchar(20) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `type` varchar(50) NOT NULL DEFAULT 'Nhà riêng',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_addr_user` (`user_id`),
  CONSTRAINT `shipping_addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.shipping_addresses: ~2 rows (approximately)
INSERT INTO `shipping_addresses` (`id`, `user_id`, `full_name`, `phone`, `address_line1`, `address_line2`, `city`, `province`, `country`, `postal_code`, `is_default`, `type`, `created_at`, `updated_at`) VALUES
	(1, 59, 'Hoang customer', '0935818725', '321', NULL, '321', '123', 'VN', NULL, 1, 'Nhà riêng', '2026-01-29 08:12:58.937', '2026-01-29 09:29:21.083'),
	(2, 59, 'bla', '0935818725', '321', NULL, '111', '111', 'VN', NULL, 0, 'Văn phòng', '2026-01-29 08:13:06.712', '2026-01-29 09:29:21.083');

-- Dumping structure for table fashion_store.shipping_methods
CREATE TABLE IF NOT EXISTS `shipping_methods` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `base_fee` decimal(12,2) NOT NULL DEFAULT 0.00,
  `fee_per_kg` decimal(12,2) NOT NULL DEFAULT 0.00,
  `min_days` int(11) NOT NULL DEFAULT 1,
  `max_days` int(11) NOT NULL DEFAULT 3,
  `provinces` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shipping_methods_code_key` (`code`),
  KEY `idx_shipping_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.shipping_methods: ~0 rows (approximately)

-- Dumping structure for table fashion_store.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `full_name` varchar(200) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `role` varchar(100) NOT NULL DEFAULT 'customer',
  `status` enum('active','blocked') NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(120) DEFAULT NULL,
  `country` varchar(50) DEFAULT 'VN',
  `province` varchar(120) DEFAULT NULL,
  `avatar_url` varchar(1000) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_username_key` (`username`),
  UNIQUE KEY `users_google_id_key` (`google_id`),
  KEY `idx_users_role` (`role`),
  CONSTRAINT `users_role_fkey` FOREIGN KEY (`role`) REFERENCES `permissions` (`name`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.users: ~57 rows (approximately)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `created_at`, `updated_at`, `address_line1`, `address_line2`, `city`, `country`, `province`, `avatar_url`, `google_id`) VALUES
	(2, 'khanh', 'khanh@example.com', '$2a$10$samplehashsamplehashsamplehashsamplehashsamplehashsampl', 'Khánh', '0900000002', 'customer', 'active', '2025-12-13 21:29:23.000', NULL, NULL, NULL, NULL, 'VN', NULL, NULL, NULL),
	(3, 'minh', 'minh@example.com', '$2a$10$samplehashsamplehashsamplehashsamplehashsamplehashsampl', 'Minh', '0900000003', 'customer', 'active', '2025-12-13 21:29:23.000', NULL, NULL, NULL, NULL, 'VN', NULL, NULL, NULL),
	(4, 'linh', 'linh@example.com', '$2a$10$samplehashsamplehashsamplehashsamplehashsamplehashsampl', 'Linh', '0900000004', 'customer', 'active', '2025-12-13 21:29:23.000', NULL, NULL, NULL, NULL, 'VN', NULL, NULL, NULL),
	(5, 'tuan_dev', 'tuan@example.com', '$2a$10$samplehashsamplehashsamplehashsamplehashsamplehashsampl', 'Tuấn Dev', '0900000005', 'customer', 'active', '2025-12-23 10:00:00.000', NULL, NULL, NULL, NULL, 'VN', NULL, NULL, NULL),
	(6, 'hoang', 'hoang@gmail.com', '$2a$10$Tj8QmKZIo/T9OYrb2ai0iOhYhJDQpq6XdBQyjARjAZq7C8pH2C8UO', 'Hoang ADMIN', '', 'admin', 'active', '2026-01-22 13:54:42.000', '2026-01-23 17:40:10.731', NULL, NULL, NULL, 'VN', NULL, NULL, NULL),
	(7, 'user_1_7041', 'long1@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Nguyễn Long', '0934656327', 'customer', 'active', '2025-06-20 23:51:22.981', '2026-01-23 07:56:07.444', '12 Võ Văn Tần', 'Thủ Đức', 'Quận 1', 'VN', 'Đà Nẵng', NULL, NULL),
	(8, 'user_2_7041', 'mai2@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Hồ Mai', '0819860543', 'customer', 'blocked', '2025-09-15 23:53:23.507', '2026-01-23 07:56:01.720', '398 Võ Văn Tần', 'Phú Nhuận', 'Đống Đa', 'VN', 'Vũng Tàu', NULL, NULL),
	(9, 'user_3_7041', 'lan3@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Lê Lan', '0984518917', 'customer', 'active', '2025-09-25 03:03:45.630', '2026-01-23 05:03:37.052', '489 Điện Biên Phủ', 'Tân Bình', 'Đống Đa', 'VN', 'TP.HCM', NULL, NULL),
	(10, 'user_4_7041', 'thao4@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Phạm Thảo', '0856789930', 'customer', 'active', '2025-08-17 03:16:52.577', '2026-01-23 05:03:37.052', '138 Nguyễn Huệ', 'Tân Bình', 'Phú Nhuận', 'VN', 'Đà Nẵng', NULL, NULL),
	(11, 'user_5_7041', 'minh5@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Dương Minh', '0903892767', 'customer', 'active', '2025-02-03 17:52:39.289', '2026-01-23 05:03:37.052', '315 Nam Kỳ Khởi Nghĩa', 'Đống Đa', 'Quận 1', 'VN', 'Buôn Ma Thuột', NULL, NULL),
	(12, 'user_6_7042', 'hai6@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Bùi Hải', '0792194879', 'customer', 'active', '2025-01-01 14:19:03.971', '2026-01-23 05:03:37.052', '243 Nguyễn Huệ', 'Quận 7', 'Tân Bình', 'VN', 'Vũng Tàu', NULL, NULL),
	(13, 'user_7_7042', 'duc7@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Hồ Đức', '0846547618', 'customer', 'active', '2025-12-14 01:12:09.857', '2026-01-23 05:03:37.052', '433 Pasteur', 'Đống Đa', 'Bình Thạnh', 'VN', 'Vũng Tàu', NULL, NULL),
	(14, 'user_8_7042', 'phuong8@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Lê Phương', '0963648417', 'customer', 'active', '2025-11-26 17:58:10.237', '2026-01-23 05:03:37.052', '286 Lê Lợi', 'Đống Đa', 'Quận 3', 'VN', 'Huế', NULL, NULL),
	(15, 'user_9_7042', 'nam9@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Ngô Nam', '0775220673', 'customer', 'active', '2025-04-24 20:56:41.955', '2026-01-23 05:03:37.052', '133 Cách Mạng Tháng 8', 'Tân Bình', 'Cầu Giấy', 'VN', 'Hà Nội', NULL, NULL),
	(16, 'user_10_7042', 'huong10@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Đặng Hương', '0966811179', 'customer', 'active', '2025-01-28 08:10:09.758', '2026-01-23 05:03:37.052', '49 Pasteur', 'Thủ Đức', 'Gò Vấp', 'VN', 'Đà Nẵng', NULL, NULL),
	(17, 'user_11_7042', 'hoang11@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Huỳnh Hoàng', '0833244147', 'customer', 'active', '2025-05-14 09:33:22.521', '2026-01-23 05:03:37.052', '313 Nam Kỳ Khởi Nghĩa', 'Quận 1', 'Thủ Đức', 'VN', 'Vũng Tàu', NULL, NULL),
	(18, 'user_12_7042', 'mai12@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Dương Mai', '0837116607', 'customer', 'blocked', '2025-12-09 00:17:40.195', '2026-01-23 05:03:37.052', '356 Hai Bà Trưng', 'Quận 1', 'Quận 7', 'VN', 'Cần Thơ', NULL, NULL),
	(19, 'user_13_7042', 'dung13@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Bùi Dũng', '0949822507', 'customer', 'active', '2025-07-23 09:34:50.238', '2026-01-23 05:03:37.052', '302 Pasteur', 'Quận 3', 'Phú Nhuận', 'VN', 'TP.HCM', NULL, NULL),
	(20, 'user_14_7042', 'minh14@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Dương Minh', '0841585117', 'customer', 'active', '2025-10-13 02:42:40.131', '2026-01-23 05:03:37.052', '146 Lý Tự Trọng', 'Quận 1', 'Cầu Giấy', 'VN', 'TP.HCM', NULL, NULL),
	(21, 'user_15_7042', 'ha15@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Bùi Hà', '0986827054', 'customer', 'active', '2025-07-03 09:51:08.688', '2026-01-23 05:03:37.052', '242 Võ Văn Tần', 'Cầu Giấy', 'Phú Nhuận', 'VN', 'Cần Thơ', NULL, NULL),
	(22, 'user_16_7042', 'hai16@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Ngô Hải', '0939580779', 'customer', 'active', '2025-08-01 01:40:23.246', '2026-01-23 05:03:37.052', '309 Điện Biên Phủ', 'Thủ Đức', 'Thủ Đức', 'VN', 'Vũng Tàu', NULL, NULL),
	(23, 'user_17_7042', 'long17@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Phan Long', '0963478517', 'customer', 'active', '2025-01-01 09:24:56.833', '2026-01-23 05:03:37.052', '155 Lê Lợi', 'Quận 7', 'Quận 7', 'VN', 'TP.HCM', NULL, NULL),
	(24, 'user_18_7042', 'tu18@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Trần Tú', '0847345923', 'customer', 'active', '2025-06-22 16:56:28.944', '2026-01-23 05:03:37.052', '275 Nguyễn Huệ', 'Bình Thạnh', 'Phú Nhuận', 'VN', 'Cần Thơ', NULL, NULL),
	(25, 'user_19_7042', 'hoang19@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Hồ Hoàng', '0967725098', 'customer', 'active', '2025-04-22 22:14:54.638', '2026-01-23 05:03:37.052', '342 Nam Kỳ Khởi Nghĩa', 'Cầu Giấy', 'Bình Thạnh', 'VN', 'Vũng Tàu', NULL, NULL),
	(26, 'user_20_7042', 'ha20@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Hoàng Hà', '0797051966', 'customer', 'active', '2025-03-23 01:37:46.842', '2026-01-23 05:03:37.052', '134 Pasteur', 'Quận 7', 'Gò Vấp', 'VN', 'Cần Thơ', NULL, NULL),
	(27, 'user_21_7042', 'lan21@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Võ Lan', '0848952278', 'customer', 'active', '2025-05-07 10:14:08.481', '2026-01-23 05:03:37.052', '272 Võ Văn Tần', 'Quận 7', 'Thủ Đức', 'VN', 'Vũng Tàu', NULL, NULL),
	(28, 'user_22_7042', 'nam22@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Võ Nam', '0976802340', 'customer', 'active', '2025-02-03 02:28:44.677', '2026-01-23 05:03:37.052', '246 Điện Biên Phủ', 'Quận 1', 'Phú Nhuận', 'VN', 'Hải Phòng', NULL, NULL),
	(29, 'user_23_7042', 'dung23@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Phạm Dũng', '0836881070', 'customer', 'active', '2025-12-08 12:49:30.369', '2026-01-23 05:03:37.052', '326 Cách Mạng Tháng 8', 'Cầu Giấy', 'Bình Thạnh', 'VN', 'Đà Nẵng', NULL, NULL),
	(30, 'user_24_7042', 'mai24@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Phạm Mai', '0948089368', 'customer', 'blocked', '2025-05-17 05:29:19.663', '2026-01-23 05:03:37.052', '424 Cách Mạng Tháng 8', 'Cầu Giấy', 'Đống Đa', 'VN', 'Hải Phòng', NULL, NULL),
	(31, 'user_25_7042', 'hung25@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Phan Hùng', '0818206559', 'customer', 'active', '2025-05-11 07:28:10.396', '2026-01-23 05:03:37.052', '24 Điện Biên Phủ', 'Quận 3', 'Quận 3', 'VN', 'Nha Trang', NULL, NULL),
	(32, 'user_26_7042', 'minh26@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Lê Minh', '0775762675', 'customer', 'active', '2025-02-22 21:44:37.700', '2026-01-23 05:03:37.052', '209 Cách Mạng Tháng 8', 'Thủ Đức', 'Phú Nhuận', 'VN', 'Huế', NULL, NULL),
	(33, 'user_27_7042', 'tu27@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Huỳnh Tú', '0974138040', 'customer', 'blocked', '2025-12-19 21:30:02.150', '2026-01-23 05:03:37.052', '342 Lý Tự Trọng', 'Tân Bình', 'Phú Nhuận', 'VN', 'Vũng Tàu', NULL, NULL),
	(34, 'user_28_7042', 'hai28@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Hoàng Hải', '0945760009', 'customer', 'active', '2025-09-09 11:59:52.086', '2026-01-23 05:03:37.052', '344 Hai Bà Trưng', 'Quận 7', 'Quận 1', 'VN', 'Hải Phòng', NULL, NULL),
	(35, 'user_29_7042', 'quang29@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Huỳnh Quang', '0968033057', 'customer', 'active', '2025-01-11 10:20:40.378', '2026-01-23 05:03:37.052', '346 Trần Hưng Đạo', 'Bình Thạnh', 'Bình Thạnh', 'VN', 'Vũng Tàu', NULL, NULL),
	(36, 'user_30_7042', 'long30@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Phạm Long', '0763892863', 'customer', 'active', '2025-04-24 16:35:49.212', '2026-01-23 05:03:37.052', '182 Nguyễn Huệ', 'Bình Thạnh', 'Quận 1', 'VN', 'Nha Trang', NULL, NULL),
	(37, 'user_31_7042', 'dung31@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Đặng Dũng', '0975199467', 'customer', 'active', '2025-09-20 17:59:34.773', '2026-01-23 05:03:37.052', '13 Pasteur', 'Phú Nhuận', 'Quận 3', 'VN', 'Hà Nội', NULL, NULL),
	(38, 'user_32_7042', 'hoang32@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Trần Hoàng', '0944796027', 'customer', 'active', '2025-03-28 05:11:28.540', '2026-01-23 05:03:37.052', '9 Điện Biên Phủ', 'Đống Đa', 'Phú Nhuận', 'VN', 'Huế', NULL, NULL),
	(39, 'user_33_7042', 'anh33@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Bùi Anh', '0836818399', 'customer', 'active', '2025-02-26 05:50:39.285', '2026-01-23 05:03:37.052', '451 Lý Tự Trọng', 'Cầu Giấy', 'Thủ Đức', 'VN', 'Hà Nội', NULL, NULL),
	(40, 'user_34_7042', 'hai34@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Hoàng Hải', '0995071772', 'customer', 'blocked', '2025-06-20 23:50:46.254', '2026-01-23 05:03:37.052', '256 Trần Hưng Đạo', 'Cầu Giấy', 'Cầu Giấy', 'VN', 'Nha Trang', NULL, NULL),
	(41, 'user_35_7042', 'tuan35@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Đặng Tuấn', '0987425930', 'customer', 'blocked', '2025-07-24 20:41:50.936', '2026-01-23 05:03:37.052', '422 Nam Kỳ Khởi Nghĩa', 'Bình Thạnh', 'Thủ Đức', 'VN', 'Vũng Tàu', NULL, NULL),
	(42, 'user_36_7042', 'minh36@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Võ Minh', '0769918268', 'customer', 'active', '2025-05-24 13:56:59.567', '2026-01-23 05:03:37.052', '299 Nguyễn Huệ', 'Quận 7', 'Thủ Đức', 'VN', 'Cần Thơ', NULL, NULL),
	(43, 'user_37_7042', 'hai37@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Huỳnh Hải', '0944968231', 'customer', 'blocked', '2025-08-06 04:41:18.114', '2026-01-23 05:03:37.052', '280 Lê Lợi', 'Gò Vấp', 'Đống Đa', 'VN', 'Vũng Tàu', NULL, NULL),
	(44, 'user_38_7042', 'thu38@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Trần Thu', '0783304050', 'customer', 'active', '2025-04-29 09:34:19.685', '2026-01-23 05:03:37.052', '229 Võ Văn Tần', 'Thủ Đức', 'Gò Vấp', 'VN', 'Huế', NULL, NULL),
	(45, 'user_39_7042', 'linh39@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Huỳnh Linh', '0854910210', 'customer', 'active', '2025-03-02 16:03:01.638', '2026-01-23 05:03:37.052', '128 Võ Văn Tần', 'Quận 1', 'Bình Thạnh', 'VN', 'Buôn Ma Thuột', NULL, NULL),
	(46, 'user_40_7042', 'huong40@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Vũ Hương', '0988275776', 'customer', 'active', '2025-07-15 17:46:57.407', '2026-01-23 05:03:37.052', '135 Trần Hưng Đạo', 'Đống Đa', 'Bình Thạnh', 'VN', 'Biên Hòa', NULL, NULL),
	(47, 'user_41_7042', 'hai41@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Lê Hải', '0987115461', 'customer', 'active', '2025-04-02 18:54:17.294', '2026-01-23 05:03:37.052', '311 Nam Kỳ Khởi Nghĩa', 'Bình Thạnh', 'Phú Nhuận', 'VN', 'Hải Phòng', NULL, NULL),
	(48, 'user_42_7042', 'tu42@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Ngô Tú', '0815280548', 'customer', 'active', '2025-10-07 12:48:01.448', '2026-01-23 05:03:37.052', '495 Võ Văn Tần', 'Gò Vấp', 'Quận 3', 'VN', 'TP.HCM', NULL, NULL),
	(49, 'user_43_7042', 'long43@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Trần Long', '0838495721', 'customer', 'active', '2025-03-14 04:41:17.924', '2026-01-23 05:03:37.052', '368 Cách Mạng Tháng 8', 'Phú Nhuận', 'Quận 1', 'VN', 'Đà Nẵng', NULL, NULL),
	(50, 'user_44_7042', 'tuan44@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Hồ Tuấn', '0963335814', 'customer', 'active', '2025-03-29 04:07:00.515', '2026-01-23 05:03:37.052', '280 Lý Tự Trọng', 'Phú Nhuận', 'Thủ Đức', 'VN', 'Buôn Ma Thuột', NULL, NULL),
	(51, 'user_45_7042', 'lan45@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Đỗ Lan', '0843386466', 'customer', 'active', '2025-01-15 02:54:13.190', '2026-01-23 05:03:37.052', '64 Trần Hưng Đạo', 'Thủ Đức', 'Phú Nhuận', 'VN', 'Đà Nẵng', NULL, NULL),
	(52, 'user_46_7042', 'quang46@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Dương Quang', '0847441303', 'customer', 'active', '2025-07-18 23:16:42.852', '2026-01-23 05:03:37.052', '447 Cách Mạng Tháng 8', 'Quận 3', 'Thủ Đức', 'VN', 'Nha Trang', NULL, NULL),
	(53, 'user_47_7042', 'nam47@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Phạm Nam', '0816458478', 'customer', 'blocked', '2025-11-10 22:56:33.793', '2026-01-23 05:03:37.052', '340 Cách Mạng Tháng 8', 'Quận 1', 'Quận 7', 'VN', 'Huế', NULL, NULL),
	(54, 'user_48_7042', 'duc48@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Bùi Đức', '0987366364', 'customer', 'active', '2025-10-12 17:29:34.208', '2026-01-23 05:03:37.052', '460 Pasteur', 'Phú Nhuận', 'Cầu Giấy', 'VN', 'TP.HCM', NULL, NULL),
	(55, 'user_49_7042', 'hung49@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Ngô Hùng', '0819943586', 'customer', 'active', '2025-04-28 14:14:05.631', '2026-01-23 05:03:37.052', '438 Nam Kỳ Khởi Nghĩa', 'Đống Đa', 'Bình Thạnh', 'VN', 'Hải Phòng', NULL, NULL),
	(56, 'user_50_7042', 'ha50@example.com', '$2a$10$n2N/rAcOk9hgDdeyyNil6O.M2eK6gR5IvrnFEL7eCraIWWQWjiisS', 'Võ Hà', '0852308122', 'customer', 'active', '2025-04-20 18:03:45.701', '2026-01-23 05:03:37.052', '299 Pasteur', 'Tân Bình', 'Phú Nhuận', 'VN', 'Huế', NULL, NULL),
	(59, 'hoang1', 'hoangdra2004@gmail.com', '$2a$10$AzTRIS.cGb6JaQsZDPeRUeZAp9gGHDwFY3tjDBrYYWhWmDuLu4DqO', 'Hoang customer', '0935818725', 'customer', 'active', '2026-01-26 04:19:43.878', '2026-01-29 09:29:21.083', '321', NULL, '321', 'VN', '123', NULL, NULL),
	(60, 'tongvanhoang782004', 'tongvanhoang782004@gmail.com', NULL, 'Tống Văn Hoàng', '', 'customer', 'active', '2026-01-29 10:03:09.596', '2026-01-29 11:53:13.359', '', NULL, '', 'VN', '', 'http://localhost:4000/uploads/1769687593335-248426637.jpg', '113035088560920067892');

-- Dumping structure for table fashion_store.variant_option_values
CREATE TABLE IF NOT EXISTS `variant_option_values` (
  `variant_id` bigint(20) unsigned NOT NULL,
  `option_value_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`variant_id`,`option_value_id`),
  KEY `idx_vov_value` (`option_value_id`),
  CONSTRAINT `variant_option_values_option_value_id_fkey` FOREIGN KEY (`option_value_id`) REFERENCES `option_values` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `variant_option_values_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.variant_option_values: ~14 rows (approximately)
INSERT INTO `variant_option_values` (`variant_id`, `option_value_id`) VALUES
	(1, 1),
	(1, 6),
	(2, 2),
	(2, 7),
	(3, 1),
	(3, 6),
	(4, 3),
	(4, 7),
	(14, 1),
	(14, 9),
	(16, 1),
	(16, 11),
	(20, 2),
	(20, 9);

-- Dumping structure for table fashion_store.wishlists
CREATE TABLE IF NOT EXISTS `wishlists` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `wishlists_user_id_key` (`user_id`),
  CONSTRAINT `wishlists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.wishlists: ~3 rows (approximately)
INSERT INTO `wishlists` (`id`, `user_id`, `created_at`) VALUES
	(3, 6, '2026-01-24 07:19:09.579'),
	(4, 59, '2026-01-26 04:19:44.030'),
	(5, 60, '2026-01-29 10:03:09.707');

-- Dumping structure for table fashion_store.wishlist_items
CREATE TABLE IF NOT EXISTS `wishlist_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `wishlist_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wl_item` (`wishlist_id`,`product_id`),
  KEY `idx_wl_product` (`product_id`),
  CONSTRAINT `wishlist_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `wishlist_items_wishlist_id_fkey` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table fashion_store.wishlist_items: ~3 rows (approximately)
INSERT INTO `wishlist_items` (`id`, `wishlist_id`, `product_id`, `created_at`) VALUES
	(7, 4, 2, '2026-01-29 07:27:48.413'),
	(8, 4, 3, '2026-01-29 07:29:04.310'),
	(12, 5, 1, '2026-01-29 12:10:24.242');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
