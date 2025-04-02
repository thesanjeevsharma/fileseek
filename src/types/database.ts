export interface User {
	id: string;
	wallet_address: string;
	reward_points: number;
	created_at: string;
}

export interface File {
	id: string;
	filecoin_hash: string;
	file_name?: string;
	file_type: string;
	file_size: number;
	thumbnail_url?: string;
	description?: string;
	network: string;
	upload_date: string;
}

export interface Tag {
	id: string;
	tag: string;
}

export interface FileTag {
	file_id: string;
	tag_id: string;
}

export interface Vote {
	id: string;
	file_id: string;
	user_id: string;
	vote_type: -1 | 1;
	created_at: string;
}

export interface Comment {
	id: string;
	file_id: string;
	user_id: string;
	comment: string;
	created_at: string;
}

export interface Report {
	id: string;
	file_id: string;
	user_id: string;
	report_reason?: string;
	created_at: string;
}

export interface Database {
	users: User[];
	files: File[];
	tags: Tag[];
	file_tags: FileTag[];
	votes: Vote[];
	comments: Comment[];
	reports: Report[];
}
