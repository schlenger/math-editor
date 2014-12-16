<?php 
	// insert the right mysql connection data!
	$db = new mysqli("server","db", "password", "dbuser");

	/**
	 * Table Structure:
	 *
	 * -- phpMyAdmin SQL Dump
	 * -- version 4.1.14.3
	 * -- http://www.phpmyadmin.net
	 * --
	 * -- Generation Time: Sep 03, 2014 at 04:03 PM
	 * -- Server version: 5.1.73-log
	 * -- PHP Version: 5.4.4-14+deb7u12
	 * SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
	 * SET time_zone = "+00:00";
	 * !40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT ;
	 * !40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS ;
	 * !40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION ;
	 * !40101 SET NAMES utf8 ;
	 * --
	 * -- Table structure for table `matsThreejsEditor`
	 * --
	 * CREATE TABLE IF NOT EXISTS `matsThreejsEditor` (
	 *   `id` varchar(32) COLLATE latin1_german2_ci NOT NULL,
	 *   `userName` varchar(30) COLLATE latin1_german2_ci NOT NULL DEFAULT 'anonymous',
	 *   `sceneName` varchar(30) COLLATE latin1_german2_ci NOT NULL DEFAULT 'My math scene',
	 *   `specification` varchar(600) COLLATE latin1_german2_ci NOT NULL DEFAULT 'No description.',
	 *   `password` varchar(12) COLLATE latin1_german2_ci DEFAULT NULL,
	 *   `public` int(1) NOT NULL DEFAULT '1',
	 *   `jsonData` varchar(30000) COLLATE latin1_german2_ci NOT NULL,
	 *   `dateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	 *   PRIMARY KEY (`id`)
	 * ) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_german2_ci;
	 */

 ?>