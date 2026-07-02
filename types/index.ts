export interface Question {
    id: string;
    text: string;
    marks: number;
    type: 'short' | 'long' | 'mcq' | 'break'; // Added 'break' for manual page breaks
    options?: string[]; // For MCQs
    correctAnswer?: string; // Correct answer (A, B, C, D) for future MCQ test grading
    bl?: string; // Bloom's Level
    co?: string; // Course Outcome
    po?: string; // Program Outcome
    orQuestion?: Question; // For either/or choice
    subQuestions?: Question[]; // For i, ii, iii parts
}

export interface Section {
    id: string;
    title?: string;
    part: string;
    requiredCount: string;
    questions: Question[];
    defaultMarks?: number; // New: Default marks for questions in this section
}

export interface PaperHeader {
    institutionName: string;
    department: string; // New
    examName: string;
    subject: string;
    courseCode: string; // New
    class: string; // New
    semester?: string; // New
    date: string;
    duration: string;
    totalMarks: number;
    registerNumber?: string;
    college?: string;
    logo?: string;
    regulation?: string;
    regNoBoxCount?: number; // Number of reg no boxes, default 15, max 20
}

export interface PageSettings {
    marginTop: number; // mm
    marginBottom: number; // mm
    marginLeft: number; // mm
    marginRight: number; // mm
    fontSize: number; // pt
    lineHeight: number; // Unitless (e.g., 1.5)
}

export interface PaperData {
    header: PaperHeader;
    sections: Section[];
    settings?: PageSettings; // New
}

// Database record types
export interface QuestionPaperRecord {
    id: string;
    title: string;
    owner_email: string;
    status: 'draft' | 'saved';
    paper_data: PaperData;
    created_at: string;
    updated_at: string;
}

export interface Collaboration {
    id: string;
    paper_id: string;
    collaborator_email: string;
    permission: 'edit' | 'view';
    created_at: string;
}
