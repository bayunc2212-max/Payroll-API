CREATE TABLE `companies` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(50),
	`email` varchar(255),
	`npwp` varchar(100),
	`logo` varchar(500),
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refresh_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'admin',
	`is_active` boolean NOT NULL DEFAULT true,
	`last_login_at` datetime,
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`department_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` varchar(36) NOT NULL,
	`employee_id` varchar(36) NOT NULL,
	`type` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_size` int,
	`mime_type` varchar(100),
	`expiry_date` date,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`department_id` varchar(36),
	`position_id` varchar(36),
	`nik` varchar(64) NOT NULL,
	`employee_number` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`gender` enum('male','female'),
	`birth_place` varchar(255),
	`birth_date` date,
	`address` text,
	`phone` varchar(50),
	`email` varchar(255),
	`photo` varchar(500),
	`marital_status` enum('single','married','divorced','widowed') DEFAULT 'single',
	`dependents` int DEFAULT 0,
	`tax_status` enum('TK0','TK1','TK2','TK3','K0','K1','K2','K3','HB0','HB1','HB2','HB3') DEFAULT 'TK0',
	`npwp` varchar(100),
	`join_date` date NOT NULL,
	`resign_date` date,
	`employee_status` enum('active','inactive','resigned','terminated') NOT NULL DEFAULT 'active',
	`basic_salary` decimal(15,2) NOT NULL DEFAULT '0',
	`allowance_transport` decimal(15,2) DEFAULT '0',
	`allowance_meal` decimal(15,2) DEFAULT '0',
	`allowance_position` decimal(15,2) DEFAULT '0',
	`allowance_other` decimal(15,2) DEFAULT '0',
	`bpjs_health_number` varchar(100),
	`bpjs_employment_number` varchar(100),
	`is_bpjs_health` boolean DEFAULT true,
	`is_bpjs_employment` boolean DEFAULT true,
	`bank_name` varchar(100),
	`bank_account_number` varchar(100),
	`bank_account_name` varchar(255),
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_nik_unique` UNIQUE(`nik`),
	CONSTRAINT `employees_employee_number_unique` UNIQUE(`employee_number`)
);
--> statement-breakpoint
CREATE TABLE `position_history` (
	`id` varchar(36) NOT NULL,
	`employee_id` varchar(36) NOT NULL,
	`department_id` varchar(36),
	`position_id` varchar(36),
	`department_name` varchar(255),
	`position_name` varchar(255),
	`effective_date` date NOT NULL,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `position_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salary_history` (
	`id` varchar(36) NOT NULL,
	`employee_id` varchar(36) NOT NULL,
	`basic_salary` decimal(15,2) NOT NULL,
	`allowance_transport` decimal(15,2) DEFAULT '0',
	`allowance_meal` decimal(15,2) DEFAULT '0',
	`allowance_position` decimal(15,2) DEFAULT '0',
	`allowance_other` decimal(15,2) DEFAULT '0',
	`effective_date` date NOT NULL,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `salary_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` varchar(36) NOT NULL,
	`employee_id` varchar(36) NOT NULL,
	`period_year` int NOT NULL,
	`period_month` int NOT NULL,
	`working_days` int NOT NULL DEFAULT 0,
	`present_days` int NOT NULL DEFAULT 0,
	`sick_days` int NOT NULL DEFAULT 0,
	`permission_days` int NOT NULL DEFAULT 0,
	`absent_days` int NOT NULL DEFAULT 0,
	`overtime_hours` decimal(8,2) DEFAULT '0',
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bpjs_config` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`health_employee_rate` decimal(5,4) NOT NULL DEFAULT '0.01',
	`health_company_rate` decimal(5,4) NOT NULL DEFAULT '0.04',
	`health_max_salary` decimal(15,2) DEFAULT '12000000',
	`jht_employee_rate` decimal(5,4) NOT NULL DEFAULT '0.02',
	`jht_company_rate` decimal(5,4) NOT NULL DEFAULT '0.037',
	`jp_employee_rate` decimal(5,4) NOT NULL DEFAULT '0.01',
	`jp_company_rate` decimal(5,4) NOT NULL DEFAULT '0.02',
	`jp_max_salary` decimal(15,2) DEFAULT '9077600',
	`jkk_rate` decimal(5,4) NOT NULL DEFAULT '0.0024',
	`jkm_rate` decimal(5,4) NOT NULL DEFAULT '0.003',
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `bpjs_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `bpjs_config_company_id_unique` UNIQUE(`company_id`)
);
--> statement-breakpoint
CREATE TABLE `loan_payments` (
	`id` varchar(36) NOT NULL,
	`loan_id` varchar(36) NOT NULL,
	`payslip_id` varchar(36),
	`amount` decimal(15,2) NOT NULL,
	`payment_date` date NOT NULL,
	`installment_number` int NOT NULL,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `loan_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` varchar(36) NOT NULL,
	`employee_id` varchar(36) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`installment_amount` decimal(15,2) NOT NULL,
	`total_installments` int NOT NULL,
	`paid_installments` int NOT NULL DEFAULT 0,
	`remaining_amount` decimal(15,2) NOT NULL,
	`loan_status` enum('pending','approved','rejected','ongoing','paid_off') NOT NULL DEFAULT 'pending',
	`approved_at` datetime,
	`start_date` date,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `loans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_periods` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`period_year` int NOT NULL,
	`period_month` int NOT NULL,
	`start_date` date NOT NULL,
	`cut_off_date` date NOT NULL,
	`payment_date` date NOT NULL,
	`working_days` int NOT NULL DEFAULT 22,
	`period_status` enum('draft','processing','processed','finalized') NOT NULL DEFAULT 'draft',
	`notes` text,
	`processed_at` datetime,
	`finalized_at` datetime,
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `payroll_periods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payslips` (
	`id` varchar(36) NOT NULL,
	`period_id` varchar(36) NOT NULL,
	`employee_id` varchar(36) NOT NULL,
	`basic_salary` decimal(15,2) NOT NULL,
	`allowance_transport` decimal(15,2) DEFAULT '0',
	`allowance_meal` decimal(15,2) DEFAULT '0',
	`allowance_position` decimal(15,2) DEFAULT '0',
	`allowance_other` decimal(15,2) DEFAULT '0',
	`overtime_pay` decimal(15,2) DEFAULT '0',
	`bonus` decimal(15,2) DEFAULT '0',
	`thr` decimal(15,2) DEFAULT '0',
	`gross_salary` decimal(15,2) NOT NULL,
	`bpjs_health_employee` decimal(15,2) DEFAULT '0',
	`bpjs_employment_jht` decimal(15,2) DEFAULT '0',
	`bpjs_employment_jp` decimal(15,2) DEFAULT '0',
	`pph21` decimal(15,2) DEFAULT '0',
	`loan_deduction` decimal(15,2) DEFAULT '0',
	`other_deduction` decimal(15,2) DEFAULT '0',
	`total_deduction` decimal(15,2) NOT NULL,
	`bpjs_health_company` decimal(15,2) DEFAULT '0',
	`bpjs_employment_jkk_company` decimal(15,2) DEFAULT '0',
	`bpjs_employment_jkm_company` decimal(15,2) DEFAULT '0',
	`bpjs_employment_jht_company` decimal(15,2) DEFAULT '0',
	`bpjs_employment_jp_company` decimal(15,2) DEFAULT '0',
	`net_salary` decimal(15,2) NOT NULL,
	`working_days` int DEFAULT 0,
	`present_days` int DEFAULT 0,
	`sick_days` int DEFAULT 0,
	`permission_days` int DEFAULT 0,
	`absent_days` int DEFAULT 0,
	`overtime_hours` decimal(8,2) DEFAULT '0',
	`payslip_status` enum('draft','finalized') NOT NULL DEFAULT 'draft',
	`email_sent_at` datetime,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `payslips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_config` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`ptkp_tk0` decimal(15,2) NOT NULL DEFAULT '54000000',
	`ptkp_tk1` decimal(15,2) NOT NULL DEFAULT '58500000',
	`ptkp_tk2` decimal(15,2) NOT NULL DEFAULT '63000000',
	`ptkp_tk3` decimal(15,2) NOT NULL DEFAULT '67500000',
	`ptkp_k0` decimal(15,2) NOT NULL DEFAULT '58500000',
	`ptkp_k1` decimal(15,2) NOT NULL DEFAULT '63000000',
	`ptkp_k2` decimal(15,2) NOT NULL DEFAULT '67500000',
	`ptkp_k3` decimal(15,2) NOT NULL DEFAULT '72000000',
	`ptkp_hb0` decimal(15,2) NOT NULL DEFAULT '112500000',
	`ptkp_hb1` decimal(15,2) NOT NULL DEFAULT '117000000',
	`ptkp_hb2` decimal(15,2) NOT NULL DEFAULT '121500000',
	`ptkp_hb3` decimal(15,2) NOT NULL DEFAULT '126000000',
	`occupational_expense_rate` decimal(5,4) NOT NULL DEFAULT '0.05',
	`occupational_expense_max` decimal(15,2) NOT NULL DEFAULT '6000000',
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `tax_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `tax_config_company_id_unique` UNIQUE(`company_id`)
);
--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `departments_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_documents` ADD CONSTRAINT `employee_documents_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `position_history` ADD CONSTRAINT `position_history_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `position_history` ADD CONSTRAINT `position_history_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `position_history` ADD CONSTRAINT `position_history_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `salary_history` ADD CONSTRAINT `salary_history_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bpjs_config` ADD CONSTRAINT `bpjs_config_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loan_payments` ADD CONSTRAINT `loan_payments_loan_id_loans_id_fk` FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loans` ADD CONSTRAINT `loans_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payroll_periods` ADD CONSTRAINT `payroll_periods_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payslips` ADD CONSTRAINT `payslips_period_id_payroll_periods_id_fk` FOREIGN KEY (`period_id`) REFERENCES `payroll_periods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payslips` ADD CONSTRAINT `payslips_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tax_config` ADD CONSTRAINT `tax_config_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;