-- Infinx Anime SQL Migration Dump for EC2

SET FOREIGN_KEY_CHECKS=0;

-- Table: Category
INSERT INTO `Category` (`id`, `name`, `slug`) VALUES (1, 'Action Movies', 'action') ON DUPLICATE KEY UPDATE `name`='Action Movies';
INSERT INTO `Category` (`id`, `name`, `slug`) VALUES (2, 'Anime Series', 'anime') ON DUPLICATE KEY UPDATE `name`='Anime Series';
INSERT INTO `Category` (`id`, `name`, `slug`) VALUES (3, 'Hollywood Movies', 'hollywood') ON DUPLICATE KEY UPDATE `name`='Hollywood Movies';
INSERT INTO `Category` (`id`, `name`, `slug`) VALUES (4, 'Web Series', 'web-series') ON DUPLICATE KEY UPDATE `name`='Web Series';
INSERT INTO `Category` (`id`, `name`, `slug`) VALUES (5, 'Horror Movies', 'horror') ON DUPLICATE KEY UPDATE `name`='Horror Movies';
INSERT INTO `Category` (`id`, `name`, `slug`) VALUES (6, 'Kids & Family', 'kids') ON DUPLICATE KEY UPDATE `name`='Kids & Family';
INSERT INTO `Category` (`id`, `name`, `slug`) VALUES (7, 'Korean Drama', 'kdrama') ON DUPLICATE KEY UPDATE `name`='Korean Drama';

-- Table: User
INSERT INTO `User` (`id`, `email`, `passwordHash`, `role`, `isBanned`, `createdAt`, `updatedAt`) VALUES (1, 'admin@infinx.com', '$2a$10$7EMEfLVjEbzy/DbZIz/HFub8RBDBO.eNITML/I/InaQVFDO2ZuLkO', 'ADMIN', 0, NOW(), NOW()) ON DUPLICATE KEY UPDATE `role`='ADMIN';
INSERT INTO `User` (`id`, `email`, `passwordHash`, `role`, `isBanned`, `createdAt`, `updatedAt`) VALUES (2, 'abcseller@gmail.com', '$2a$10$nJ9dHhHevkndvz0XZs5LveIH94RbOrDP5E7u9AsXzrjRbluqeZE8m', 'USER', 0, NOW(), NOW()) ON DUPLICATE KEY UPDATE `role`='USER';

-- Table: Show
INSERT INTO `Show` (`id`, `title`, `description`, `type`, `rating`, `poster`, `banner`, `year`, `runtime`, `badge`, `dubsub`, `views`, `isFeatured`, `createdAt`, `updatedAt`) VALUES (14, 'Loki', 'The mercurial villain Loki resumes his role as the God of Mischief in a new series that takes place after the events of “Avengers: Endgame.”', 'series', 8.2, 'https://serverbuket-12.s3.ap-south-1.amazonaws.com/posters/1785566065355-loki.jpg', NULL, '2021–2023', '6 Ep', 'HD', 1, 0, 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE `title`='Loki';
INSERT INTO `CategoryOnShow` (`showId`, `categoryId`) VALUES (14, 4) ON DUPLICATE KEY UPDATE `showId`=14;
INSERT INTO `Episode` (`id`, `showId`, `title`, `episodeNumber`, `description`, `duration`, `videoUrl`, `transcodeStatus`, `stageDetails`, `views`, `createdAt`, `updatedAt`) VALUES (327, 14, 'S1.E1 ∙ Glorious Purpose', 1, NULL, NULL, 'https://serverbuket-12.s3.ap-south-1.amazonaws.com/videos/show_14/ep_327/master.m3u8', 'COMPLETED', '{"uploadServer":{"percent":100,"speed":"Done","eta":0,"status":"COMPLETED"},"transcoding":{"percent":45.5,"speed":"1.8x","eta":30,"status":"PROCESSING"},"uploadS3":{"percent":0,"speed":"0 MB/s","eta":0,"status":"PENDING"}}', 23, NOW(), NOW()) ON DUPLICATE KEY UPDATE `title`='S1.E1 ∙ Glorious Purpose';
INSERT INTO `Episode` (`id`, `showId`, `title`, `episodeNumber`, `description`, `duration`, `videoUrl`, `transcodeStatus`, `stageDetails`, `views`, `createdAt`, `updatedAt`) VALUES (328, 14, 'S1.E2 ∙ The Variant', 2, NULL, NULL, NULL, 'PROCESSING', '{"uploadServer":{"percent":100,"speed":"Done","eta":0,"status":"COMPLETED"},"transcoding":{"percent":100,"speed":"Done","eta":0,"status":"COMPLETED"},"uploadS3":{"percent":80.2,"speed":"364 KB/s","eta":488,"status":"PROCESSING"}}', 2, NOW(), NOW()) ON DUPLICATE KEY UPDATE `title`='S1.E2 ∙ The Variant';

SET FOREIGN_KEY_CHECKS=1;
