"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { PaperData, Question, Section, PageSettings } from "@/types";
import QuestionForm from "./QuestionForm";
import Preview from "./Preview";
import Modal from "./ui/Modal";
import { Printer, Trash2, Pencil, Settings, RotateCcw, Plus, ChevronDown, ChevronUp, Save, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { detectExamCategory } from "@/lib/examCategory";
import { exportToPDF } from "@/lib/pdfExport";

interface EditorProps {
  initialData?: PaperData;
  paperId?: string | null;
  onSave?: (
    data: PaperData, 
    status: 'draft' | 'saved',
    reviewStatus?: string,
    examCategory?: string | null,
    submittedAt?: string | null
  ) => Promise<string | null>;
}

const formatDateDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
};

const initialPaperData: PaperData = {
  header: {
    institutionName: "SRM Institute of Science and Technology",
    college: "Faculty of Science and Humanities, KTRR",
    department: "Department of Computer Applications, ",
    examName: "Model Examination, ",
    subject: "",
    courseCode: "",
    class: "",
    semester: "",
    date: "",
    duration: "",
    totalMarks: 100,
    logo: "/srm.png",
  },
  sections: [
    {
      id: "sec-1",
      title: "Part-A",
      part: "A",
      requiredCount: "ALL",
      defaultMarks: 2,
      questions: [],
    },
  ],
  settings: {
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    fontSize: 12,
    lineHeight: 1.5,
  }
};

const DEPARTMENTS = [
  "Department of Biochemistry, ",
  "Department of Biotechnology, ",
  "Career Development Centre, ",
  "Department of Commerce, ",
  "Department of Computer Applications",
  "Department of Computer Science, ",
  "Department of Corporate Secretaryship and Accounting & Finance, ",
  "Department of Defence and Strategic Studies, ",
  "School of Education, ",
  "Department of Economics, ",
  "Department of English, , ",
  "Department of Fashion Designing, ",
  "Department of French, ",
  "Department of Hindi, ",
  "Institute of Hotel and Catering Management, ",
  "Department of Journalism and Mass Communication, ",
  "Department of Mathematics and Statistics, ",
  "Department of Physical Education & Sports Sciences, ",
  "Department of Psychology, ",
  "Department of Social Work, ",
  "Department of Tamil, ",
  "Department of Visual Communication, ",
  "Department of Yoga, "
];

const EXAMS = [
  "Cycle Test – I, ",
  "Cycle Test – II, ",
  "Model Examination"
];

interface SyllabusCourse {
  code: string;
  title: string;
  sem: number;
  course?: string;          // e.g. "BCA", "BSc", etc. If omitted, matches all
  specialization?: string;  // e.g. "DS", "CS", etc. If omitted, matches all
  regulation?: string;      // e.g. "2024", "2025"
}

const COURSES_DATABASE: SyllabusCourse[] = [
  // SEMESTER 1
  { code: "ULT24AE1J", title: "Tamil – I, ", sem: 1 },
  { code: "ULH24AE1J", title: "Hindi – I, ", sem: 1 },
  { code: "ULF24AE1J", title: "French – I, ", sem: 1 },
  { code: "ULE24AE1J", title: "English", sem: 1, course: "BCA", specialization: "CA" },
  { code: "ULE24AE1J", title: "English", sem: 1, course: "BSc" },
  { code: "UCA24101J", title: "Digital Logic Design, ", sem: 1, course: "BCA", specialization: "CA" },
  { code: "USA24102J", title: "Programming for Problem Solving, , ", sem: 1, course: "BCA", specialization: "CA" },
  { code: "UMS24101T", title: "Discrete Mathematical Structures, , ", sem: 1, course: "BCA", specialization: "CA" },
  { code: "UCD24S01J", title: "Verbal Ability and Skill Development, ", sem: 1 },
  { code: "ULE24AE2J", title: "Business English, ", sem: 1, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24101J", title: "Programming using Java, ", sem: 1, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24102J", title: "Fundamentals of Data Science, ", sem: 1, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UMS24103T", title: "Mathematics for Artificial Intelligence, , ", sem: 1, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "ULE24AE2J", title: "Business English", sem: 1, course: "BCA", specialization: "GEN AI" },
  { code: "UDS24101J", title: "Programming using Java", sem: 1, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24102J", title: "Generative Artificial Intelligence, ", sem: 1, course: "BCA", specialization: "GEN AI" },
  { code: "UMS24103T", title: "Mathematics for Artificial Intelligence", sem: 1, course: "BCA", specialization: "GEN AI" },
  { code: "UAI24101J", title: "Computing Fundamentals, ", sem: 1, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24102J", title: "Introduction to Artificial Intelligence and Machine Learning, ", sem: 1, course: "BSc", specialization: "CS AI&ML" },
  { code: "UMS24103T", title: "Mathematics for Artificial Intelligence", sem: 1, course: "BSc", specialization: "CS AI&ML" },
  { code: "USC24101J", title: "Hardware Maintenance and Troubleshooting, ", sem: 1, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USA24102J", title: "Programming for Problem Solving", sem: 1, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UMS24101T", title: "Discrete Mathematical Structures", sem: 1, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24101J", title: "Digital Electronics, ", sem: 1, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "USA24102J", title: "Programming for Problem Solving", sem: 1, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UMS24101T", title: "Discrete Mathematical Structures", sem: 1, course: "BSc", specialization: "COMPUTER SCIENCE" },

  // SEMESTER 2
  { code: "ULT24AE2J", title: "Tamil – II, ", sem: 2 },
  { code: "ULH24AE2J", title: "Hindi – II, ", sem: 2 },
  { code: "ULF24AE2J", title: "French – II, ", sem: 2 },
  { code: "USA24201J", title: "Data Structures and Algorithms, , , , , ", sem: 2, course: "BCA", specialization: "CA" },
  { code: "UCA24202J", title: "Object Oriented Programming, ", sem: 2, course: "BCA", specialization: "CA" },
  { code: "UMS24202T", title: "Mathematical Foundation, ", sem: 2, course: "BCA", specialization: "CA" },
  { code: "UCD24V01T", title: "Essentials of Artificial Intelligence, ", sem: 2 },
  { code: "UCA24M01J", title: "Web Technology, ", sem: 2, course: "BCA", specialization: "CA" },
  { code: "UCD24S02L", title: "Quantitative Aptitude and Logical Reasoning, ", sem: 2 },
  { code: "UNS24Y01L", title: "NSS, ", sem: 2 },
  { code: "UNC24Y01L", title: "NCC, ", sem: 2 },
  { code: "UNO24Y01L", title: "NSO, ", sem: 2 },
  { code: "UYG24Y01L", title: "YOGA, ", sem: 2 },
  { code: "UDS24201J", title: "Elements of Distributed Data Processing, ", sem: 2, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24202J", title: "Data Structures and Algorithms", sem: 2, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UMS24203T", title: "Statistics for Artificial Intelligence, , , ", sem: 2, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24M01J", title: "Internet of Things, ", sem: 2, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UGI24201J", title: "Machine Learning for Natural Language Processing, ", sem: 2, course: "BCA", specialization: "GEN AI" },
  { code: "UDS24202J", title: "Data Structures and Algorithms", sem: 2, course: "BCA", specialization: "GEN AI" },
  { code: "UMS24203T", title: "Statistics for Artificial Intelligence", sem: 2, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24M01J", title: "Advance Excel and Power BI, ", sem: 2, course: "BCA", specialization: "GEN AI" },
  { code: "USA24201J", title: "Data Structures and Algorithms", sem: 2, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24202J", title: "Object Oriented Programming using Java, , ", sem: 2, course: "BSc", specialization: "CS AI&ML" },
  { code: "UMS24203T", title: "Statistics for Artificial Intelligence", sem: 2, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24M01J", title: "Introduction to ICT Tools, , ", sem: 2, course: "BSc", specialization: "CS AI&ML" },
  { code: "USC24201T", title: "Office Productivity Software, ", sem: 2, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24202J", title: "Object Oriented Programming using Java", sem: 2, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USC24202J", title: "Introduction to Cyber Security, ", sem: 2, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24M01J", title: "Introduction to ICT Tools", sem: 2, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USA24201J", title: "Data Structures and Algorithms", sem: 2, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24202J", title: "Object Oriented Programming using Java", sem: 2, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UMS24202T", title: "Mathematical Foundation", sem: 2, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24M01J", title: "Introduction to ICT Tools", sem: 2, course: "BSc", specialization: "COMPUTER SCIENCE" },

  // SEMESTER 3
  { code: "UCA24301J", title: "Programming using Java", sem: 3, course: "BCA", specialization: "CA" },
  { code: "USA24302J", title: "Database Management System", sem: 3, course: "BCA", specialization: "CA" },
  { code: "UMS24303T", title: "Statistical Methods", sem: 3, course: "BCA", specialization: "CA" },
  { code: "UDS24E01J", title: "Data Science and Analytics", sem: 3 },
  { code: "UCA24M02J", title: "Go Programming", sem: 3, course: "BCA", specialization: "CA" },
  { code: "UCA24P01L", title: "Internship -I", sem: 3, course: "BCA", specialization: "CA" },
  { code: "UDS24301J", title: "Data Engineering for Enterprises", sem: 3, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24302J", title: "Database Management System", sem: 3, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24303J", title: "Natural Language Processing", sem: 3, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24P01L", title: "Internship - I", sem: 3, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24M02J", title: "Digital Transformation", sem: 3, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UGI24301J", title: "Python with Django Framework", sem: 3, course: "BCA", specialization: "GEN AI" },
  { code: "UDS24302J", title: "Database Management System", sem: 3, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24303T", title: "Deep Learning", sem: 3, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24P01L", title: "Internship – I", sem: 3, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24M02J", title: "Cyber Security", sem: 3, course: "BCA", specialization: "GEN AI" },
  { code: "UCS24301J", title: "Operating System", sem: 3, course: "BSc", specialization: "CS AI&ML" },
  { code: "USA24302J", title: "Database Management System", sem: 3, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24303J", title: "Machine Learning using Python", sem: 3, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24P01L", title: "Internship – I", sem: 3, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24M02J", title: "Fundamentals of Digital Marketing", sem: 3, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24301J", title: "Operating System", sem: 3, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USA24302J", title: "Database Management System", sem: 3, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USC24301J", title: "Basics of Ethical Hacking for Cyber Security", sem: 3, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24P01L", title: "Internship – I", sem: 3, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24M02J", title: "Fundamentals of Digital Marketing", sem: 3, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24301J", title: "Operating System", sem: 3, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "USA24302J", title: "Database Management System", sem: 3, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UMS24303T", title: "Statistical Methods", sem: 3, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24P01L", title: "Internship – I", sem: 3, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24M02J", title: "Fundamentals of Digital Marketing", sem: 3, course: "BSc", specialization: "COMPUTER SCIENCE" },

  // SEMESTER 4
  { code: "USA24401J", title: "Python Programming", sem: 4, course: "BCA", specialization: "CA" },
  { code: "UMS24D01T", title: "Resource Management Techniques", sem: 4, course: "BCA", specialization: "CA" },
  { code: "UMS24D02T", title: "Numerical Methods", sem: 4, course: "BCA", specialization: "CA" },
  { code: "UDS24E02J", title: "Data Analytics using Spreadsheet", sem: 4 },
  { code: "UDS24E03J", title: "Essentials of Machine Learning", sem: 4 },
  { code: "UEN24S01L", title: "Communication Skills", sem: 4 },
  { code: "UCD24S03J", title: "Industry Oriented Employability and Leadership Skills", sem: 4 },
  { code: "UMI24Y01L", title: "My India Project", sem: 4 },
  { code: "UDS24401J", title: "Deep Learning", sem: 4, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D01J", title: "Advanced Computing with Python", sem: 4, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D02J", title: "Machine Learning", sem: 4, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UGI24401J", title: "Generative AI and LLM Frameworks", sem: 4, course: "BCA", specialization: "GEN AI" },
  { code: "UDS24D01J", title: "Advanced Computing with Python", sem: 4, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D02J", title: "Artificial Neural Networks", sem: 4, course: "BCA", specialization: "GEN AI" },
  { code: "UAI24401J", title: "Computer Networks", sem: 4, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D01J", title: "Introduction to Artificial Neural Networks", sem: 4, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D02J", title: "Applications of Artificial Intelligence", sem: 4, course: "BSc", specialization: "CS AI&ML" },
  { code: "USC24401J", title: "Data Privacy and Security", sem: 4, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UMS24D01T", title: "Resource Management Techniques", sem: 4, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UMS24D03T", title: "Statistical Methods", sem: 4, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USA24401J", title: "Python Programming", sem: 4, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UMS24D01T", title: "Resource Management Techniques", sem: 4, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UMS24D02T", title: "Numerical Methods", sem: 4, course: "BSc", specialization: "COMPUTER SCIENCE" },

  // SEMESTER 5
  { code: "UCA24D03J", title: "Computer Networks", sem: 5, course: "BCA", specialization: "CA" },
  { code: "UCA24D04J", title: "Windows Programming", sem: 5, course: "BCA", specialization: "CA" },
  { code: "UCA24D05J", title: "Open Source Technologies", sem: 5, course: "BCA", specialization: "CA" },
  { code: "UCA24D06J", title: "Operating Systems", sem: 5, course: "BCA", specialization: "CA" },
  { code: "UDS24E04J", title: "Programming using R", sem: 5 },
  { code: "UCA24M03J", title: "Data Analysis using R", sem: 5, course: "BCA", specialization: "CA" },
  { code: "UES24V01T", title: "Environmental Studies", sem: 5 },
  { code: "UCD24S04J", title: "Career Readiness and Professional Skills", sem: 5 },
  { code: "UCA24P02L", title: "Internship - II", sem: 5, course: "BCA", specialization: "CA" },
  { code: "UDS24D03J", title: "Deep Learning with Keras and Tensorflow", sem: 5, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D04J", title: "Big Data Analytics with Applications", sem: 5, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D05J", title: "Intelligent Automation", sem: 5, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D06J", title: "Computer Vision", sem: 5, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24P02L", title: "Internship - II", sem: 5, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24M03J", title: "Blockchain Technology", sem: 5, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UGI24D03J", title: "Generative Adversarial Network", sem: 5, course: "BCA", specialization: "GEN AI" },
  { code: "UDS24D04J", title: "Big Data Analytics with Applications", sem: 5, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D05J", title: "Large Language Model", sem: 5, course: "BCA", specialization: "GEN AI" },
  { code: "UDS24D06J", title: "Computer Vision", sem: 5, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24P02L", title: "Internship – II", sem: 5, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24M03J", title: "Game Theory and AI", sem: 5, course: "BCA", specialization: "GEN AI" },
  { code: "UAI24D03J", title: "Introduction to Internet of Things", sem: 5, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D04J", title: "Human Machine Interaction", sem: 5, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D05J", title: "Data Science and its Applications", sem: 5, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D06J", title: "Software Engineering and Project Management", sem: 5, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24P02L", title: "Internship – II", sem: 5, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24M03J", title: "Basics of Web Application Development", sem: 5, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24D01J", title: "Software Engineering", sem: 5, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24D02J", title: "Computer Networks and Data Communication", sem: 5, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USC24D01J", title: "Penetration Testing", sem: 5, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USC24D02J", title: "Social Media Cyber Security", sem: 5, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24P02L", title: "Internship - II", sem: 5, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24M03J", title: "Basics of Web Application Development", sem: 5, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24D01J", title: "Software Engineering", sem: 5, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D02J", title: "Computer Networks and Data Communication", sem: 5, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D03J", title: "Object Oriented Analysis and Design", sem: 5, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D04J", title: "Machine Learning", sem: 5, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24P02L", title: "Internship – II", sem: 5, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24M03J", title: "Basics of Web Application Development", sem: 5, course: "BSc", specialization: "COMPUTER SCIENCE" },

  // SEMESTER 6
  { code: "USA24D07J", title: "Cloud Computing", sem: 6, course: "BCA", specialization: "CA" },
  { code: "UCA24D08J", title: "Web Development using AngularJS and MongoDB", sem: 6, course: "BCA", specialization: "CA" },
  { code: "UCA24D09T", title: "Software Engineering and Testing", sem: 6, course: "BCA", specialization: "CA" },
  { code: "USA24D10T", title: "Wireless Communication and Mobile Computing", sem: 6, course: "BCA", specialization: "CA" },
  { code: "UDS24E05J", title: "Programming Using Python", sem: 6 },
  { code: "UDS24E06J", title: "Introduction to Deep Learning", sem: 6 },
  { code: "UCA24P03L", title: "Project Work", sem: 6, course: "BCA", specialization: "CA" },
  { code: "UCD24V02T", title: "Universal Human Values", sem: 6 },
  { code: "UDS24D07J", title: "Advanced Analytics and Data Visualization", sem: 6, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D08J", title: "Data Science for Business Analytics", sem: 6, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D09J", title: "Artificial Intelligence and Automation for Enterprises", sem: 6, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D10J", title: "Data Wrangling", sem: 6, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24P03L", title: "Project Work", sem: 6, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D07J", title: "Advanced Analytics and Data Visualization", sem: 6, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D08J", title: "Prompt Engineering", sem: 6, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D09J", title: "Image Generative Models", sem: 6, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D10J", title: "Advanced Web Application Development", sem: 6, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24P03L", title: "Project Work", sem: 6, course: "BCA", specialization: "GEN AI" },
  { code: "UAI24D07J", title: "Deep Learning Techniques", sem: 6, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D08J", title: "Blockchain Technology", sem: 6, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D09J", title: "Reinforcement Learning", sem: 6, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D10J", title: "Natural Language Processing", sem: 6, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24P03L", title: "Project Work", sem: 6, course: "BSc", specialization: "CS AI&ML" },
  { code: "USC24D03J", title: "Security Threats and Principles", sem: 6, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USC24D04J", title: "Malware Analysis", sem: 6, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USA24D07J", title: "Cloud Computing", sem: 6, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USC24601J", title: "Data Science using Python Programming", sem: 6, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24P03L", title: "Project Work", sem: 6, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24D05J", title: "Fundamentals of Business Application Development", sem: 6, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D06J", title: "NLP and Language Models", sem: 6, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "USA24D07J", title: "Cloud Computing", sem: 6, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D08J", title: "Microprocessors and Embedded Systems", sem: 6, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24P03L", title: "Project Work", sem: 6, course: "BSc", specialization: "COMPUTER SCIENCE" },

  // SEMESTER 7
  { code: "UCA24D11T", title: "Research Methodology in Computer Applications", sem: 7, course: "BCA", specialization: "CA" },
  { code: "UDS24D12T", title: "Data Analytics for Project Management", sem: 7, course: "BCA", specialization: "CA" },
  { code: "UCA24D13J", title: "Programming using C#", sem: 7, course: "BCA", specialization: "CA" },
  { code: "UCA24D14J", title: "Internet of Things", sem: 7, course: "BCA", specialization: "CA" },
  { code: "UCA24D15J", title: "Object Oriented Analysis and Design", sem: 7, course: "BCA", specialization: "CA" },
  { code: "UCA24D16J", title: "Computer Vision", sem: 7, course: "BCA", specialization: "CA" },
  { code: "UDS24E07J", title: "Applications of Computer Vision", sem: 7 },
  { code: "UDS24E08J", title: "Data Visualization Tools", sem: 7 },
  { code: "UDS24D11T", title: "Research Methodology in Data Science", sem: 7, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D12T", title: "Data Analytics for Project Management", sem: 7, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D13J", title: "Data Warehousing and Data Mining", sem: 7, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D14J", title: "Cloud and Grid Computing", sem: 7, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D15J", title: "Machine Learning for Enterprises", sem: 7, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D16J", title: "Real World Computer Vision Applications", sem: 7, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UGI24D11T", title: "Research Methodology in Generative AI", sem: 7, course: "BCA", specialization: "GEN AI" },
  { code: "UDS24D12T", title: "Data Analytics for Project Management", sem: 7, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D13J", title: "Human Machine Interaction", sem: 7, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D14J", title: "Working with Industrial Internet of Things", sem: 7, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D15J", title: "Artificial Intelligence and Machine Learning for Robotics", sem: 7, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D16J", title: "Web Intelligence and Mining", sem: 7, course: "BCA", specialization: "GEN AI" },
  { code: "UAI24D11J", title: "Robotics and Intelligent Systems", sem: 7, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D12J", title: "Applications of Edge IoT and ML", sem: 7, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D13J", title: "Mobile Application Development", sem: 7, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D14J", title: "Real World Computer Visions Applications", sem: 7, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D15J", title: "Business Intelligence", sem: 7, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D16J", title: "Optimization Concepts for Data Science and Artificial Intelligence", sem: 7, course: "BSc", specialization: "CS AI&ML" },
  { code: "USC24D05J", title: "E - Commerce, Digital Payments and Security", sem: 7, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USC24D06J", title: "Cyber Security of Digital Devices", sem: 7, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USC24D07J", title: "Cyber Security Plan and Crisis Management", sem: 7, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "USC24D08J", title: "Cyber Crimes", sem: 7, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24D13J", title: "Big Data Analytics", sem: 7, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24D14J", title: "Cryptography and Network Security", sem: 7, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24D09J", title: "Mobile Application Development", sem: 7, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "USA24D10T", title: "Wireless Communication and Mobile Computing", sem: 7, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D11J", title: "Web Application Framework", sem: 7, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D12J", title: "Computer Vision", sem: 7, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D13J", title: "Big Data Analytics", sem: 7, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D14J", title: "Cryptography and Network Security", sem: 7, course: "BSc", specialization: "COMPUTER SCIENCE" },

  // SEMESTER 8
  { code: "UCA24D17J", title: "Web Development using Node JS and MongoDB", sem: 8, course: "BCA", specialization: "CA" },
  { code: "USA24D18J", title: "Cyber Security", sem: 8, course: "BCA", specialization: "CA" },
  { code: "UCA24D19J", title: "Big Data Analytics", sem: 8, course: "BCA", specialization: "CA" },
  { code: "USA24D20J", title: "Blockchain Technology", sem: 8, course: "BCA", specialization: "CA" },
  { code: "UCA24P04L", title: "Research Project and Dissertation", sem: 8, course: "BCA", specialization: "CA" },
  { code: "UCA24P05L", title: "Professional Internship", sem: 8, course: "BCA", specialization: "CA" },
  { code: "UDS24D17J", title: "Technology Leadership and Innovation Management", sem: 8, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D18J", title: "Social Media and Text Analytics", sem: 8, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D19T", title: "Statistical Analysis and Business Applications", sem: 8, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24D20T", title: "Applications of Edge IoT and Machine Learning", sem: 8, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24P04L", title: "Research Project and Dissertation", sem: 8, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UDS24P05L", title: "Professional Internship", sem: 8, course: "BCA", specialization: "DATA SCIENCE" },
  { code: "UGI24D17J", title: "Security, Ethics and Bias in Generative AI", sem: 8, course: "BCA", specialization: "GEN AI" },
  { code: "UDS24D18J", title: "Social Media and Text Analytics", sem: 8, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24D19T", title: "Reinforcement Learning", sem: 8, course: "BCA", specialization: "GEN AI" },
  { code: "UDS24D20T", title: "Applications of Edge IoT and Machine Learning", sem: 8, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24P04L", title: "Research Project and Dissertation", sem: 8, course: "BCA", specialization: "GEN AI" },
  { code: "UGI24P05L", title: "Professional Internship", sem: 8, course: "BCA", specialization: "GEN AI" },
  { code: "UAI24D17J", title: "Web Intelligence and Mining", sem: 8, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D18J", title: "Advanced Analytics and Data Visualization for Enterprise", sem: 8, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D19J", title: "Recommendation Systems", sem: 8, course: "BSc", specialization: "CS AI&ML" },
  { code: "UAI24D20J", title: "Planning Techniques for Robotics", sem: 8, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24P04L", title: "Research Project and Dissertation", sem: 8, course: "BSc", specialization: "CS AI&ML" },
  { code: "UCS24P05L", title: "Professional Internship", sem: 8, course: "BSc", specialization: "CS AI&ML" },
  { code: "USA24D20J", title: "Blockchain Technology", sem: 8, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24D18T", title: "Introduction to Cyber Physical Systems", sem: 8, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24D15J", title: "AI and Business Analytics", sem: 8, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UAI24D17J", title: "Web Intelligence and Mining", sem: 8, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24P04L", title: "Research Project and Dissertation", sem: 8, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24P05L", title: "Professional Internship", sem: 8, course: "BSc", specialization: "CS CYBER SECURITY" },
  { code: "UCS24D15J", title: "AI and Business Analytics", sem: 8, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "USA24D18J", title: "Cyber Security", sem: 8, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "USA24D20J", title: "Blockchain Technology", sem: 8, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24D18T", title: "Introduction to Cyber Physical Systems", sem: 8, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24P04L", title: "Research Project and Dissertation", sem: 8, course: "BSc", specialization: "COMPUTER SCIENCE" },
  { code: "UCS24P05L", title: "Professional Internship", sem: 8, course: "BSc", specialization: "COMPUTER SCIENCE" },

  // MCA COMPUTER APPLICATION (MCA CA)
  // Semester I
  { code: "PCA25C01J", title: "Object Oriented Programming using Java", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCA25C02T", title: "Data Structures and Algorithms", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCA25C03J", title: "Database Technology", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCA25D01J", title: "Software Engineering and Testing", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCA25D02J", title: "Advanced Web Technology", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCA25D03J", title: "Natural Language Processing", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCA25G01T", title: "Cyber Security", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCA25G02T", title: "Soft Computing", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCA25G03T", title: "Distributed Computing", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCA25S01J", title: "Data Mining Techniques", sem: 1, course: "MCA", specialization: "CA" },
  { code: "PCD25AE1T", title: "Comprehensive Skills in Quantitative and Logical Reasoning", sem: 1, course: "MCA", specialization: "CA" },
  // Semester II
  { code: "PCA25C04J", title: "Data Analysis using Python Programming", sem: 2, course: "MCA", specialization: "CA" },
  { code: "PCA25C05T", title: "Optimization Techniques", sem: 2, course: "MCA", specialization: "CA" },
  { code: "PCA25C06J", title: "Advanced Operating System", sem: 2, course: "MCA", specialization: "CA" },
  { code: "PCA25C07J", title: "Artificial Intelligence and Machine Learning", sem: 2, course: "MCA", specialization: "CA" },
  { code: "PCA25D04J", title: "Software Project Management", sem: 2, course: "MCA", specialization: "CA" },
  { code: "PCA25D05J", title: "Mobile Applications Development", sem: 2, course: "MCA", specialization: "CA" },
  { code: "PCA25D06J", title: "Data Visualization Techniques", sem: 2, course: "MCA", specialization: "CA" },
  { code: "PCA25S02J", title: "Internet of Things (IoT)", sem: 2, course: "MCA", specialization: "CA" },
  { code: "PCD25AE2T", title: "Soft Skills and Verbal Mastery", sem: 2, course: "MCA", specialization: "CA" },
  // Semester III
  { code: "PCA25C08J", title: "Data Communication Networks", sem: 3, course: "MCA", specialization: "CA" },
  { code: "PCA25C09T", title: "Cloud and Quantum Computing", sem: 3, course: "MCA", specialization: "CA" },
  { code: "PCA25C10L", title: "Capstone Project", sem: 3, course: "MCA", specialization: "CA" },
  { code: "PCA25D07J", title: "Software Quality Assurance", sem: 3, course: "MCA", specialization: "CA" },
  { code: "PCA25D08J", title: "Augmented Reality and Virtual Reality", sem: 3, course: "MCA", specialization: "CA" },
  { code: "PCA25D09J", title: "Computer Vision", sem: 3, course: "MCA", specialization: "CA" },
  { code: "PCA25G04T", title: "Blockchain Technology", sem: 3, course: "MCA", specialization: "CA" },
  { code: "PCA25G05T", title: "Cyber Forensics", sem: 3, course: "MCA", specialization: "CA" },
  { code: "PCA25G06T", title: "Big Data Analytics", sem: 3, course: "MCA", specialization: "CA" },
  { code: "PCA25P01L", title: "Internship", sem: 3, course: "MCA", specialization: "CA" },
  // Semester IV
  { code: "PCA25P02L", title: "Project Work", sem: 4, course: "MCA", specialization: "CA" },

  // MCA GENERATIVE ARTIFICIAL INTELLIGENCE
  // Semester I
  { code: "PCA25C01J", title: "Object Oriented Programming using Java", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PCA25C02T", title: "Data Structures and Algorithms", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PCA25C03J", title: "Database Technology", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25D01J", title: "Introduction to Computer Vision", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25D02J", title: "Intelligent Language Processing", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25D03J", title: "Intelligent Internet of Things (IIoT)", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25G01T", title: "Deep Neural Networks", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25G02T", title: "Building GPT Powered Business Applications", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25G03T", title: "Cloud Infrastructure for Generative AI", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25S01J", title: "Generative AI and Open AI", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PCD25AE1T", title: "Comprehensive Skills in Quantitative and Logical Reasoning", sem: 1, course: "MCA", specialization: "Generative Artificial Intelligence" },
  // Semester II
  { code: "PCA25C04J", title: "Data Analysis using Python Programming", sem: 2, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PCA25C05T", title: "Optimization Techniques", sem: 2, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PCA25C06J", title: "Advanced Operating System", sem: 2, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PCA25C07J", title: "Artificial Intelligence and Machine Learning", sem: 2, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25D04J", title: "Augmented Reality and Virtual Reality", sem: 2, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25D05J", title: "Generative AI and Large Language Models", sem: 2, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25D06J", title: "IoT Cloud Infrastructure and Protocols", sem: 2, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25S02J", title: "Prompt Engineering in Generative AI", sem: 2, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PCD25AE2T", title: "Soft Skills and Verbal Mastery", sem: 2, course: "MCA", specialization: "Generative Artificial Intelligence" },
  // Semester III
  { code: "PCA25C08J", title: "Data Communication Networks", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PCA25C09T", title: "Cloud and Quantum Computing", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PCA25C10L", title: "Capstone Project", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25D07J", title: "Computer Vision in Smart Robotics", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25D08J", title: "Building Conversational AI for Human Resources", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25D09J", title: "IoT Devices with Computer Vision Technologies", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25G04T", title: "Data Engineering and Analytics", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25G05T", title: "Distributed Data Processing Systems", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25G06T", title: "Quantum Machine Learning", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  { code: "PGI25P01L", title: "Internship", sem: 3, course: "MCA", specialization: "Generative Artificial Intelligence" },
  // Semester IV
  { code: "PGI25P02L", title: "Project Work", sem: 4, course: "MCA", specialization: "Generative Artificial Intelligence" },

  // MSC APPLIED DATA SCIENCE
  // Semester I
  { code: "PAD25C01T", title: "Statistical Foundations", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25C02J", title: "Data Analysis Fundamentals", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25C03J", title: "Data Structures and Algorithms", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25D01J", title: "Artificial Intelligence", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25D02J", title: "Big Data Analytics", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25D03J", title: "Data Engineering and Governance", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25G01T", title: "Data Mining and Warehousing", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25G02T", title: "Ethics in Data Science", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25S01J", title: "Data Visualization and Concepts", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PCD25AE1T", title: "Comprehensive Skills in Quantitative and Logical Reasoning", sem: 1, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  // Semester II
  { code: "PAD25C04J", title: "Natural Language Processing", sem: 2, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25C05J", title: "Machine Learning", sem: 2, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25C06J", title: "Social Media and Text Analytics", sem: 2, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25C07J", title: "Computer Vision", sem: 2, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25D04T", title: "Reinforcement Learning for AI", sem: 2, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25D05T", title: "Time Series Analysis", sem: 2, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25D06T", title: "Mathematics for Data Science", sem: 2, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25S02J", title: "SQL and NoSQL for Data Science", sem: 2, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PCD25AE2T", title: "Soft Skills and Verbal Mastery", sem: 2, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  // Semester III
  { code: "PAD25C08T", title: "Cloud Computing", sem: 3, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25C09J", title: "Deep Learning", sem: 3, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25C10L", title: "Capstone Project", sem: 3, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25D07J", title: "Large Language Models", sem: 3, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25D08J", title: "Exploratory Data Analysis", sem: 3, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25D09J", title: "Quantum Machine Learning", sem: 3, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25G03T", title: "Digital Marketing Analytics", sem: 3, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PCA25G04T", title: "Blockchain Technology", sem: 3, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  { code: "PAD25P01L", title: "Internship", sem: 3, course: "MSc", specialization: "APPLIED DATA SCIENCE" },
  // Semester IV
  { code: "PAD25P02L", title: "Project Work", sem: 4, course: "MSc", specialization: "APPLIED DATA SCIENCE" },

  // MSc Computer Science with Specialization in Full Stack Development (FSD)
  // Semester I
  { code: "PCS25C11J", title: "Data Structures and Algorithms", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PCS25C12J", title: "Java Programming", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PCS25C13J", title: "Computer Networks", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25D11J", title: "Web Development Fundamentals", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25D12J", title: "Agile Methodologies", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25D13J", title: "Front End Frameworks", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25G11J", title: "REST and GraphQL API Development", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25G12T", title: "Innovation in Startup Skills", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25G13T", title: "Ethical Hacking", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PCD25AE1T", title: "Comprehensive Skills in Quantitative and Logical Reasoning", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25S11J", title: "Linux Administration and Shell Scripting", sem: 1, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  // Semester II
  { code: "PCS25C21J", title: "Open Source Technology", sem: 2, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25C22T", title: "Software Engineering", sem: 2, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25C23J", title: "Introduction to Databases for Back-End Development", sem: 2, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25C24J", title: "Python Programming", sem: 2, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25D21J", title: "Software Testing", sem: 2, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25D22J", title: "AI and ML for Web Applications", sem: 2, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25D23J", title: "Web Security", sem: 2, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25S21J", title: "Version Control System", sem: 2, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PCD25AE2T", title: "Soft Skills and Verbal Mastery", sem: 2, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  // Semester III
  { code: "PFS25C31J", title: "DevOps", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PCS25C32J", title: "Compiler Design", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25C33J", title: "Principles of UX/UI Design", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25D31J", title: "Mobile Application Development", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25D32J", title: "Blockchain", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25D33J", title: "IoT and Edge Computing", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25G34J", title: "JavaScript", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PCS25G35J", title: "Responsible AI", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PFS25G36J", title: "MongoDB", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  { code: "PCS25P31L", title: "Internship", sem: 3, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },
  // Semester IV
  { code: "PCS25P41L", title: "Project Work", sem: 4, course: "MSc", specialization: "Computer Science with Specialization in Full Stack Development" },

  // MSc Computer Science (MSc CS)
  // Semester I
  { code: "PCS25C11J", title: "Data Structures and Algorithms", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25C12J", title: "Java Programming", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25C13J", title: "Computer Networks", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25D11T", title: "Software Testing", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25D12J", title: "Artificial Intelligence", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25D13J", title: "Cloud Services Management", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25G11J", title: "Service Oriented Architecture", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25G12J", title: "Data Analysis using Open Source Tools", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25G13J", title: "Cloud Computing Tools and Techniques", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25S11J", title: "Information Literacy", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCD25AE1T", title: "Comprehensive Skills in Quantitative and Logical Reasoning", sem: 1, course: "MSc", specialization: "COMPUTER SCIENCE" },
  // Semester II
  { code: "PCS25C21J", title: "Open Source Technology", sem: 2, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25C22J", title: "Distributed Operating System", sem: 2, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25C23J", title: "Database Management", sem: 2, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25C24T", title: "Software Engineering", sem: 2, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25D21T", title: "Agile Software Development", sem: 2, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25D22J", title: "Machine Learning", sem: 2, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25D23J", title: "Information Storage Management", sem: 2, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25S21J", title: "Web Development using AngularJS and Mongo", sem: 2, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCD25AE2T", title: "Soft Skills and Verbal Mastery", sem: 2, course: "MSc", specialization: "COMPUTER SCIENCE" },
  // Semester III
  { code: "PCS25C31J", title: "Python Programming", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25C32J", title: "Compiler Design", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25C33J", title: "Big Data Analytics", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25D31T", title: "Artificial Intelligence in Software Engineering", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25D32J", title: "Deep Learning", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25D33J", title: "Interfacing with Virtualization", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25G34J", title: "Software Project Management", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25G35J", title: "Responsible AI", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25G36J", title: "Security and Privacy in Cloud", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  { code: "PCS25P31L", title: "Internship", sem: 3, course: "MSc", specialization: "COMPUTER SCIENCE" },
  // Semester IV
  { code: "PCS25P41L", title: "Project Work", sem: 4, course: "MSc", specialization: "COMPUTER SCIENCE" },

  // MSc Information Technology (MSc IT)
  // Semester I
  { code: "PIT25C11J", title: "Distributed Operating System", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25C12J", title: "Java Programming", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25C13J", title: "Data Mining and Data Warehousing", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25D11T", title: "Software Engineering", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25D12J", title: "Cryptography and Network Security", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCS25D13J", title: "Cloud Services Management", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCS25G11J", title: "Service Oriented Architecture", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25G12J", title: "Prompt Engineering", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCS25G13J", title: "Cloud Computing Tools and Techniques", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCD25AE1T", title: "Comprehensive Skills in Quantitative and Logical Reasoning", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25S11J", title: "HTML and CSS", sem: 1, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  // Semester II
  { code: "PIT25C21J", title: "Introduction to Machine Learning", sem: 2, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25C22J", title: "Database Technologies", sem: 2, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25C23J", title: "Enterprise Java Programming", sem: 2, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25C24J", title: "Mobile Application Development", sem: 2, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25D21T", title: "Software Testing", sem: 2, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25D22J", title: "Social Network Security", sem: 2, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCS25D23J", title: "Information Storage Management", sem: 2, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25S21J", title: "Web Development using AngularJS and MongoDB", sem: 2, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCD25AE2T", title: "Soft Skills and Verbal Mastery", sem: 2, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  // Semester III
  { code: "PIT25C31J", title: "Python Programming", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25C32J", title: "Open Source Technologies", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25C33J", title: "Big Data Analytics", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25D31T", title: "Agile Software Development", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25D32J", title: "Blockchain Technology", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCS25D33J", title: "Interfacing with Virtualization", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCS25G34J", title: "Software Project Management", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCS25G35J", title: "Responsible AI", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PCS25G36J", title: "Security and Privacy in Cloud", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  { code: "PIT25P31L", title: "Internship", sem: 3, course: "MSc", specialization: "INFORMATION TECHNOLOGY" },
  // Semester IV
  { code: "PIT25P41L", title: "Project Work", sem: 4, course: "MSc", specialization: "INFORMATION TECHNOLOGY" }
];

const COURSE_SPECIALIZATIONS: Record<string, string[]> = {
  BCA: ["CA", "DATA SCIENCE", "GEN AI"],
  BSC: ["COMPUTER SCIENCE", "CS AI&ML", "CS CYBER SECURITY"],
  MCA: ["CA", "Generative Artificial Intelligence"],
  MSC: [
    "COMPUTER SCIENCE",
    "APPLIED DATA SCIENCE",
    "Computer Science with Specialization in Full Stack Development",
    "INFORMATION TECHNOLOGY"
  ]
};

const getYearFromSem = (semNum: number): string => {
  const years = ["", "I", "II", "III", "IV"];
  const yearIdx = Math.ceil(semNum / 2);
  return years[yearIdx] || "";
};

const getRomanSem = (semNum: number): string => {
  const sems = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  return sems[semNum] || "";
};

const getSelectedSem = (semester: string | undefined): string => {
  if (!semester) return "";
  const romanToSemMap: Record<string, number> = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8
  };
  return romanToSemMap[semester]?.toString() || "";
};

const isElective = (code: string): boolean => {
  if (!code || code.length < 6) return false;
  const char = code.charAt(5).toUpperCase();
  return char === 'E' || char === 'D' || char === 'S';
};

const isMultidisciplinary = (code: string): boolean => {
  if (!code || code.length < 6) return false;
  const char = code.charAt(5).toUpperCase();
  return char === 'M' || char === 'G';
};

export default function Editor({ initialData, paperId: initialPaperId, onSave }: EditorProps = {}) {
  const startData = useMemo(() => {
    const raw = initialData || initialPaperData;
    const data = JSON.parse(JSON.stringify(raw));
    if (data.header) {
      const exam = data.header.examName || '';
      const lower = exam.toLowerCase();
      if (lower.includes('cyclic') || lower.includes('cylic') || lower.includes('cycle')) {
        if (lower.includes('2') || lower.includes('ii')) {
          data.header.examName = 'Cycle Test – II';
        } else {
          data.header.examName = 'Cycle Test – I';
        }
      } else if (lower.includes('model')) {
        data.header.examName = 'Model Examination';
      }
    }
    return data;
  }, [initialData]);

  const [paperData, setPaperData] = useState<PaperData>(startData);
  const [activeSectionId, setActiveSectionId] = useState<string>(startData.sections[0]?.id || 'sec-1');

  useEffect(() => {
    setPaperData(startData);
    if (startData.sections?.[0]?.id) {
      setActiveSectionId(startData.sections[0].id);
    }
  }, [initialPaperId, startData]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showBlCoPo, setShowBlCoPo] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.04);
  const [autoCapitalize, setAutoCapitalize] = useState(true);
  const [allCaps, setAllCaps] = useState(false);
  const [showDate, setShowDate] = useState(true);
  const [manualCourseEntry, setManualCourseEntry] = useState(false);
  const [customSpecEntry, setCustomSpecEntry] = useState(false);
  const [showElectiveOnly, setShowElectiveOnly] = useState(false);
  const [showMultiOnly, setShowMultiOnly] = useState(false);
  const [coursesList, setCoursesList] = useState<SyllabusCourse[]>(COURSES_DATABASE);

  useEffect(() => {
    async function fetchSyllabus() {
      try {
        const client = createClient();
        const { data, error } = await client
          .from('syllabus_courses')
          .select('code, title, sem, course, specialization, regulation');
        
        if (error) {
          console.error('Error fetching syllabus courses from Supabase:', error.message);
          return;
        }
        if (data && data.length > 0) {
          setCoursesList(data as SyllabusCourse[]);
        }
      } catch (err) {
        console.error('Failed to load syllabus courses from Supabase:', err);
      }
    }
    fetchSyllabus();
  }, []);

  const selectedSemNum = useMemo(() => {
    return parseInt(getSelectedSem(paperData.header.semester)) || 0;
  }, [paperData.header.semester]);

  const selectedCourse = useMemo(() => {
    const parts = (paperData.header.class || '').split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    const firstToken = parts[0] || '';
    const isYear = /^(1st|2nd|3rd|4th|[IVXLCDM]+)$/i.test(firstToken);
    return (isYear ? parts[1] || '' : parts[0]).trim().toLowerCase();
  }, [paperData.header.class]);

  const selectedSpec = useMemo(() => {
    const parts = (paperData.header.class || '').split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    const firstToken = parts[0] || '';
    const isYear = /^(1st|2nd|3rd|4th|[IVXLCDM]+)$/i.test(firstToken);
    const startIdx = isYear ? 2 : 1;
    return parts.slice(startIdx).join(' ').trim().toLowerCase();
  }, [paperData.header.class]);

  const specsList = useMemo(() => {
    return COURSE_SPECIALIZATIONS[selectedCourse.toUpperCase()] || [];
  }, [selectedCourse]);

  const regulationsList = useMemo(() => {
    const regs = Array.from(new Set(coursesList.map(c => c.regulation || '2024')));
    if (!regs.includes('2024')) regs.push('2024');
    return regs.sort();
  }, [coursesList]);

  const selectedRegulation = useMemo(() => {
    return paperData.header.regulation || '2024';
  }, [paperData.header.regulation]);

  const semesterCourses = useMemo(() => {
    if (!selectedSemNum) return [];
    return coursesList.filter((c) => {
      // 1. Regulation check
      const courseReg = c.regulation || '2024';
      if (courseReg !== selectedRegulation) return false;

      // 2. Semester check
      if (c.sem !== selectedSemNum) return false;

      // 3. Course check
      if (c.course && c.course.trim().toLowerCase() !== selectedCourse) return false;

      // 4. Specialization check
      if (c.specialization && c.specialization.trim().toLowerCase() !== selectedSpec) return false;

      // 5. Elective / Multidisciplinary Filter
      if (showElectiveOnly && !isElective(c.code)) return false;
      if (showMultiOnly && !isMultidisciplinary(c.code)) return false;

      return true;
    });
  }, [selectedSemNum, selectedCourse, selectedSpec, coursesList, selectedRegulation, showElectiveOnly, showMultiOnly]);

  useEffect(() => {
    setManualCourseEntry(false);
    setCustomSpecEntry(false);
  }, [selectedSemNum, selectedCourse]);

  const [logoSize, setLogoSize] = useState(60);
  const [watermarkSize, setWatermarkSize] = useState(200);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(initialPaperId || null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-save draft on changes (5s debounce)
  const triggerAutoSave = useCallback((data: PaperData) => {
    if (!onSave) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const id = await onSave(data, 'draft');
      if (id) {
        setCurrentPaperId(id);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    }, 5000);
  }, [onSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Load default read-only institution and college details from DB on mount
  useEffect(() => {
    async function fetchSystemSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setPaperData(prev => ({
            ...prev,
            header: {
              ...prev.header,
              institutionName: data.institutionName || prev.header.institutionName,
              college: data.college || prev.header.college
            }
          }));
        }
      } catch (err) {
        console.error('Failed to load system settings:', err);
      }
    }
    fetchSystemSettings();
  }, []);

  // Build choice lists for Department and Exam Name, prepending custom values if not found in default list
  const deptOptions = useMemo(() => {
    const list = [...DEPARTMENTS];
    const current = paperData.header.department;
    if (current && !list.includes(current)) {
      list.unshift(current);
    }
    return list;
  }, [paperData.header.department]);

  const isCustomExam = useMemo(() => {
    const exam = paperData.header.examName || '';
    if (exam === '') return false;
    return exam !== 'Cycle Test – I' && exam !== 'Cycle Test – II' && exam !== 'Model Examination';
  }, [paperData.header.examName]);

  const dropdownValue = useMemo(() => {
    if (isCustomExam) return 'Custom';
    return paperData.header.examName || '';
  }, [paperData.header.examName, isCustomExam]);

  // Wrap setPaperData to trigger autosave
  const setPaperDataWithAutoSave = useCallback((updater: PaperData | ((prev: PaperData) => PaperData)) => {
    setPaperData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      triggerAutoSave(next);
      return next;
    });
  }, [triggerAutoSave]);

  const handleSaveDraft = async () => {
    if (!onSave || isSavingDb) return;
    setIsSavingDb(true);
    setSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const id = await onSave(paperData, 'draft');
    if (id) {
      setCurrentPaperId(id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
    }
    setIsSavingDb(false);
  };

  const handleSaveFinal = async () => {
    if (!onSave || isSavingDb) return;
    setIsSavingDb(true);
    setSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    const examName = paperData.header.examName || '';
    const category = detectExamCategory(examName);
    
    let id: string | null = null;

    if (category) {
      // Detected cycle test or model exam -> submit for review
      id = await onSave(
        paperData, 
        'saved',
        'pending', // reviewStatus
        category,  // examCategory
        new Date().toISOString() // submittedAt
      );
      if (id) {
        let label = 'Cycle Test-I';
        if (category === 'cycle_test_2') label = 'Cycle Test-II';
        if (category === 'model_exam') label = 'Model Exam';
        alert(`Submitted to SysOps for review under ${label}`);
      }
    } else {
      // Normal save
      id = await onSave(paperData, 'saved');
    }

    if (id) {
      setCurrentPaperId(id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
    }
    setIsSavingDb(false);
  };
  const calculatedTotalMarks = paperData.sections.reduce(
    (acc, section) => acc + section.questions.reduce((qAcc, q) => qAcc + q.marks, 0),
    0
  );

  const handleHeaderChange = (field: keyof typeof paperData.header, value: string | number) => {
    setPaperDataWithAutoSave((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
  };

  const updateSettings = (field: keyof PageSettings, value: any) => {
    setPaperDataWithAutoSave(prev => ({
      ...prev,
      settings: {
        ...prev.settings!,
        [field]: value
      }
    }));
  };

  const resetSettings = () => {
    setPaperDataWithAutoSave(prev => ({
      ...prev,
      settings: initialPaperData.settings
    }));
  };

  const addSection = () => {
    const existingParts = paperData.sections.map(s => s.part);
    let nextPart = "A";
    for (let i = 0; i < 7; i++) {
      const char = String.fromCharCode(65 + i);
      if (!existingParts.includes(char)) {
        nextPart = char;
        break;
      }
    }

    const newSection: Section = {
      id: crypto.randomUUID(),
      part: nextPart,
      requiredCount: "ALL",
      defaultMarks: 2,
      questions: [],
    };
    setPaperDataWithAutoSave((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setActiveSectionId(newSection.id);
    setShowSectionModal(true);
  };

  const handleEditSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setShowSectionModal(true);
  };

  const updateSectionField = (sectionId: string, field: keyof Section, value: any) => {
    setPaperDataWithAutoSave(prev => ({
      ...prev,
      sections: prev.sections.map(sec =>
        sec.id === sectionId ? { ...sec, [field]: value } : sec
      )
    }));
  };

  const moveQuestion = (sectionId: string, index: number, direction: 'up' | 'down') => {
    setPaperDataWithAutoSave(prev => {
      const newSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const newQuestions = [...sec.questions];
          if (direction === 'up' && index > 0) {
            [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
          } else if (direction === 'down' && index < newQuestions.length - 1) {
            [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
          }
          return { ...sec, questions: newQuestions };
        }
        return sec;
      });
      return { ...prev, sections: newSections };
    });
  };

  const deleteSection = (sectionId: string) => {
    if (paperData.sections.length === 1) return;
    setPaperDataWithAutoSave((prev) => {
      const newSections = prev.sections.filter((s) => s.id !== sectionId);
      return { ...prev, sections: newSections };
    });
    if (activeSectionId === sectionId) {
      setActiveSectionId(paperData.sections[0].id);
    }
    setShowSectionModal(false);
  };

  const addQuestion = (question: Question) => {
    if (editingQuestion) {
      setPaperDataWithAutoSave((prev) => ({
        ...prev,
        sections: prev.sections.map((sec) => {
          if (sec.id === activeSectionId) {
            return {
              ...sec,
              questions: sec.questions.map((q) => (q.id === editingQuestion.id ? question : q)),
            };
          }
          return sec;
        }),
      }));
      setEditingQuestion(null);
    } else {
      setPaperDataWithAutoSave((prev) => ({
        ...prev,
        sections: prev.sections.map((sec) => {
          if (sec.id === activeSectionId) {
            return { ...sec, questions: [...sec.questions, question] };
          }
          return sec;
        }),
      }));
    }
    setShowQuestionModal(false);
  };

  const handleAddQuestion = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setEditingQuestion(null);
    setShowQuestionModal(true);
  };

  const editQuestion = (question: Question, sectionId: string) => {
    setActiveSectionId(sectionId);
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    setPaperDataWithAutoSave((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return { ...sec, questions: sec.questions.filter((q) => q.id !== questionId) };
        }
        return sec;
      }),
    }));
  };

  const handlePrint = async () => {
    if (!previewRef.current || isSavingPdf) return;
    setIsSavingPdf(true);
    
    const success = await exportToPDF(previewRef.current, paperData);
    if (!success) {
      alert('Failed to generate PDF. Please try again.');
    }
    
    setIsSavingPdf(false);
  };

  return (
    <div className="flex h-screen overflow-hidden print:overflow-visible print:h-auto" style={{ background: '#f0f7f4' }}>
      {/* Left Panel - Editor */}
      <div className="w-1/2 flex flex-col h-full print:hidden" style={{ borderRight: '1px solid #e2e5ea' }}>
        <header className="px-5 py-3 flex justify-between items-center sticky top-0 z-10" style={{ background: '#fff', borderBottom: '1px solid #e2e5ea' }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Qedit" width={120} height={32} className="h-8 w-auto" priority />
            </div>
            <div className="h-6 w-px bg-[#2a7d5f] opacity-20 hidden sm:block"></div>
            <div className="hidden sm:flex items-center opacity-90">
              <Image src="/blacklive.png" alt="Livewires" width={140} height={40} className="h-6 sm:h-7 w-auto object-contain" priority />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {/* Save status indicator */}
            {onSave && saveStatus !== 'idle' && (
              <span className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md" style={{
                color: saveStatus === 'saved' ? '#2a7d5f' : saveStatus === 'error' ? '#dc2626' : '#6b7280',
                background: saveStatus === 'saved' ? '#e8f5ee' : saveStatus === 'error' ? '#fef2f2' : '#f8f9fb',
              }}>
                {saveStatus === 'saving' && '⏳ Saving...'}
                {saveStatus === 'saved' && <><CheckCircle size={12} /> Saved</>}
                {saveStatus === 'error' && '⚠ Save failed'}
              </span>
            )}
            {onSave && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDb}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-60"
                  style={{ background: '#fff', color: '#4b5563', border: '1px solid #d1d5db' }}
                  onMouseEnter={(e) => { if (!isSavingDb) { e.currentTarget.style.background = '#f1f3f6'; } }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                >
                  <Save size={15} /> Draft
                </button>
                <button
                  onClick={handleSaveFinal}
                  disabled={isSavingDb}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white transition-colors disabled:opacity-60"
                  style={{ background: '#1e6b4f' }}
                  onMouseEnter={(e) => { if (!isSavingDb) e.currentTarget.style.background = '#175a42'; }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#1e6b4f')}
                >
                  <CheckCircle size={15} /> Save Final
                </button>
              </>
            )}
            <button
              onClick={() => setShowPageSetup(!showPageSetup)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
              style={{
                background: showPageSetup ? '#e8f5ee' : '#fff',
                color: showPageSetup ? '#2a7d5f' : '#4b5563',
                border: `1px solid ${showPageSetup ? '#a7d7c5' : '#d1d5db'}`,
              }}
            >
              <Settings size={15} /> Page Setup
            </button>
            <button
              onClick={handlePrint}
              disabled={isSavingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white transition-colors disabled:opacity-60"
              style={{ background: '#2a7d5f' }}
              onMouseEnter={(e) => { if (!isSavingPdf) e.currentTarget.style.background = '#236b50'; }}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2a7d5f')}
            >
              <Printer size={15} /> {isSavingPdf ? 'Generating...' : 'Save as PDF'}
            </button>
          </div>
        </header>



        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header Details Form */}
          <div className="p-4 rounded-lg space-y-4" style={{ background: '#fff', border: '1px solid #e2e5ea' }}>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid #f1f3f6' }}>
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>Header Details</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                    <label className="text-[10px] font-medium" style={{ color: '#6b7280' }}>Auto Caps</label>
                    <button type="button" onClick={() => setAutoCapitalize(!autoCapitalize)} className="relative w-6 h-3.5 rounded-full transition-colors" style={{ background: autoCapitalize ? '#2a7d5f' : '#d1d5db' }}>
                      <span className="absolute top-0.5 rounded-full w-2.5 h-2.5 bg-white transition-all shadow-sm" style={{ left: autoCapitalize ? '12px' : '2px' }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                    <label className="text-[10px] font-medium" style={{ color: '#6b7280' }}>ALL CAPS</label>
                    <button type="button" onClick={() => setAllCaps(!allCaps)} className="relative w-6 h-3.5 rounded-full transition-colors" style={{ background: allCaps ? '#2a7d5f' : '#d1d5db' }}>
                      <span className="absolute top-0.5 rounded-full w-2.5 h-2.5 bg-white transition-all shadow-sm" style={{ left: allCaps ? '12px' : '2px' }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                    <label className="text-[10px] font-medium" style={{ color: '#6b7280' }}>Date</label>
                    <button type="button" onClick={() => setShowDate(!showDate)} className="relative w-6 h-3.5 rounded-full transition-colors" style={{ background: showDate ? '#2a7d5f' : '#d1d5db' }}>
                      <span className="absolute top-0.5 rounded-full w-2.5 h-2.5 bg-white transition-all shadow-sm" style={{ left: showDate ? '12px' : '2px' }} />
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => setHeaderCollapsed(!headerCollapsed)} className="p-1 rounded transition-colors" style={{ color: '#9ca3af' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                {headerCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
            {!headerCollapsed && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Institution Name</label>
                  <input type="text" readOnly value={paperData.header.institutionName} placeholder="SRM Institute of Science and Technology" className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #e2e5ea', color: '#6b7280', backgroundColor: '#f9fafb', cursor: 'not-allowed', textTransform: allCaps ? 'uppercase' : 'none' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>College</label>
                  <input type="text" readOnly value={paperData.header.college || ''} placeholder="Faculty of Science and Humanities, KTR" className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #e2e5ea', color: '#6b7280', backgroundColor: '#f9fafb', cursor: 'not-allowed', textTransform: allCaps ? 'uppercase' : 'none' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Department</label>
                  <select
                    value={paperData.header.department || ''}
                    onChange={(e) => handleHeaderChange('department', e.target.value)}
                    className="w-full p-2 text-sm rounded-md"
                    style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                  >
                    <option value="">Select Department</option>
                    {deptOptions.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Internal Exams</label>
                  <select
                    value={dropdownValue}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (selectedVal === 'Cycle Test – I') {
                        setPaperDataWithAutoSave(prev => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            examName: 'Cycle Test – I',
                            totalMarks: 50
                          }
                        }));
                      } else if (selectedVal === 'Cycle Test – II') {
                        setPaperDataWithAutoSave(prev => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            examName: 'Cycle Test – II',
                            totalMarks: 50
                          }
                        }));
                      } else if (selectedVal === 'Model Examination') {
                        setPaperDataWithAutoSave(prev => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            examName: 'Model Examination',
                            totalMarks: 100
                          }
                        }));
                      } else if (selectedVal === 'Custom') {
                        setPaperDataWithAutoSave(prev => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            examName: 'Custom Exam'
                          }
                        }));
                      } else {
                        handleHeaderChange('examName', selectedVal);
                      }
                    }}
                    className="w-full p-2 text-sm rounded-md"
                    style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                  >
                    <option value="">Select Internal Exam</option>
                    <option value="Cycle Test – I">Cycle Test – I</option>
                    <option value="Cycle Test – II">Cycle Test – II</option>
                    <option value="Model Examination">Model Examination</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {isCustomExam && (
                    <input
                      type="text"
                      value={paperData.header.examName === 'Custom Exam' ? '' : paperData.header.examName}
                      placeholder="Enter Custom Exam Name"
                      onChange={(e) => handleHeaderChange('examName', e.target.value || 'Custom Exam')}
                      className="w-full p-2 mt-2 text-sm rounded-md"
                      style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#fff' }}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Regulation</label>
                  <select
                    value={paperData.header.regulation || '2024'}
                    onChange={(e) => handleHeaderChange('regulation', e.target.value)}
                    className="w-full p-2 text-sm rounded-md"
                    style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                  >
                    {regulationsList.map((reg) => (
                      <option key={reg} value={reg}>{reg} Regulation</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Class</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={(() => {
                        const c = paperData.header.class || '';
                        const parts = c.split(' ').filter(Boolean);
                        if (parts.length === 0) return '';
                        const firstToken = parts[0] || '';
                        const isYear = /^(1st|2nd|3rd|4th|[IVXLCDM]+)$/i.test(firstToken);
                        return (isYear ? parts[1] || '' : parts[0]);
                      })()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const currentParts = (paperData.header.class || '').split(' ').filter(Boolean);
                        const firstToken = currentParts[0] || '';
                        const isYear = /^(1st|2nd|3rd|4th|[IVXLCDM]+)$/i.test(firstToken);
                        const year = isYear ? firstToken : '';
                        const startIdx = isYear ? 2 : 1;
                        const spec = currentParts.slice(startIdx).join(' ') || '';
                        
                        const newClass = [year, val, spec].filter(Boolean).join(' ');
                        handleHeaderChange('class', newClass);
                      }}
                      className="p-2 text-sm rounded-md"
                      style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                    >
                      <option value="">Select Course</option>
                      <option value="BCA">BCA</option>
                      <option value="BSc">BSc</option>
                      <option value="BA">BA</option>
                      <option value="BBA">BBA</option>
                      <option value="BCom">BCom</option>
                      <option value="BE">BE</option>
                      <option value="MCA">MCA</option>
                      <option value="MSc">MSc</option>
                    </select>

                    {specsList.length > 0 && !customSpecEntry ? (
                      <select
                        value={(() => {
                          const c = paperData.header.class || '';
                          const parts = c.split(' ').filter(Boolean);
                          if (parts.length === 0) return '';
                          const firstToken = parts[0] || '';
                          const isYear = /^(1st|2nd|3rd|4th|[IVXLCDM]+)$/i.test(firstToken);
                          const startIdx = isYear ? 2 : 1;
                          return parts.slice(startIdx).join(' ') || '';
                        })()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setCustomSpecEntry(true);
                          } else {
                            const currentParts = (paperData.header.class || '').split(' ').filter(Boolean);
                            const firstToken = currentParts[0] || '';
                            const isYear = /^(1st|2nd|3rd|4th|[IVXLCDM]+)$/i.test(firstToken);
                            const year = isYear ? firstToken : '';
                            const course = isYear ? currentParts[1] || '' : currentParts[0] || '';
                            
                            const newClass = [year, course, val].filter(Boolean).join(' ');
                            handleHeaderChange('class', newClass);
                          }
                        }}
                        className="p-2 text-sm rounded-md"
                        style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                      >
                        <option value="">Select Specialization</option>
                        {specsList.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                        <option value="custom">Custom...</option>
                      </select>
                    ) : (
                      <div className="relative flex items-center w-full">
                        <input
                          type="text"
                          value={(() => {
                            const c = paperData.header.class || '';
                            const parts = c.split(' ').filter(Boolean);
                            if (parts.length === 0) return '';
                            const firstToken = parts[0] || '';
                            const isYear = /^(1st|2nd|3rd|4th|[IVXLCDM]+)$/i.test(firstToken);
                            const startIdx = isYear ? 2 : 1;
                            return parts.slice(startIdx).join(' ') || '';
                          })()}
                          onChange={(e) => {
                            const val = e.target.value;
                            const currentParts = (paperData.header.class || '').split(' ').filter(Boolean);
                            const firstToken = currentParts[0] || '';
                            const isYear = /^(1st|2nd|3rd|4th|[IVXLCDM]+)$/i.test(firstToken);
                            const year = isYear ? firstToken : '';
                            const course = isYear ? currentParts[1] || '' : currentParts[0] || '';
                            
                            const newClass = [year, course, val].filter(Boolean).join(' ');
                            handleHeaderChange('class', newClass);
                          }}
                          placeholder="e.g. DATA SCIENCE"
                          className="p-2 text-sm rounded-md pr-8 w-full"
                          style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                        />
                        {specsList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setCustomSpecEntry(false)}
                            className="absolute right-2 text-gray-400 hover:text-gray-600 text-xs"
                            title="Select from list"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Semester</label>
                  <select
                    value={getSelectedSem(paperData.header.semester)}
                    onChange={(e) => {
                      const val = e.target.value;
                      const currentParts = (paperData.header.class || '').split(' ').filter(Boolean);
                      if (currentParts.length === 0) return;
                      const firstToken = currentParts[0] || '';
                      const isYear = /^(1st|2nd|3rd|4th|[IVXLCDM]+)$/i.test(firstToken);
                      const course = isYear ? currentParts[1] || '' : currentParts[0] || '';
                      const startIdx = isYear ? 2 : 1;
                      const spec = currentParts.slice(startIdx).join(' ') || '';

                      if (!val) {
                        const newClass = [course, spec].filter(Boolean).join(' ');
                        setPaperDataWithAutoSave((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            class: newClass,
                            semester: ""
                          }
                        }));
                        return;
                      }

                      const S = parseInt(val);
                      const calculatedYear = getYearFromSem(S);
                      const newClass = [calculatedYear, course, spec].filter(Boolean).join(' ');
                      const calculatedRomanSem = getRomanSem(S);
                      setPaperDataWithAutoSave((prev) => ({
                        ...prev,
                        header: {
                          ...prev.header,
                          class: newClass,
                          semester: calculatedRomanSem
                        }
                      }));
                    }}
                    className="w-full p-2 text-sm rounded-md"
                    style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-xs font-medium" style={{ color: '#374151' }}>Course Code</label>
                    {semesterCourses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setManualCourseEntry(!manualCourseEntry)}
                        className="text-[10px] hover:underline"
                        style={{ color: '#2a7d5f' }}
                      >
                        {manualCourseEntry ? "Select from list" : "Enter manually"}
                      </button>
                    )}
                  </div>
                  {semesterCourses.length > 0 && !manualCourseEntry ? (
                    <select
                      value={paperData.header.courseCode || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'manual') {
                          setManualCourseEntry(true);
                        } else {
                          const foundCourse = semesterCourses.find(c => c.code === val);
                          setPaperDataWithAutoSave((prev) => ({
                            ...prev,
                            header: {
                              ...prev.header,
                              courseCode: val,
                              subject: foundCourse ? foundCourse.title : prev.header.subject
                            }
                          }));
                        }
                      }}
                      className="w-full p-2 text-sm rounded-md"
                      style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                    >
                      <option value="">Select Course Code</option>
                      {semesterCourses.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.title}
                        </option>
                      ))}
                      <option value="manual">Enter Manually...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={paperData.header.courseCode || ''}
                      onChange={(e) => {
                        let v = e.target.value;
                        if (allCaps) v = v.toUpperCase();
                        handleHeaderChange('courseCode', v);
                      }}
                      placeholder="e.g. UCS2401"
                      className="w-full p-2 text-sm rounded-md"
                      style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5', textTransform: allCaps ? 'uppercase' : 'none' }}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Subject</label>
                  <input type="text" value={paperData.header.subject} onChange={(e) => { let v = e.target.value; if (autoCapitalize) v = v.replace(/\b\w/g, c => c.toUpperCase()); if (allCaps) v = v.toUpperCase(); handleHeaderChange('subject', v); }} placeholder="e.g. Data Structures" className="w-full p-2 text-sm rounded-md" style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5', textTransform: allCaps ? 'uppercase' : 'none' }} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Reg No. Boxes</label>
                  <input type="number" min="5" max="20" value={paperData.header.regNoBoxCount || 15} onChange={(e) => handleHeaderChange('regNoBoxCount', Math.min(20, Math.max(5, parseInt(e.target.value) || 15)))} className="w-full p-2 text-sm rounded-md" style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }} />
                </div>
                <div className="col-span-2 flex gap-4">
                  {showDate && (
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Date <span className="font-normal" style={{ color: '#9ca3af' }}>(optional)</span></label>
                      <input type="date" value={paperData.header.date} onChange={(e) => handleHeaderChange('date', e.target.value)} className="w-full p-2 text-sm rounded-md" style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }} />
                    </div>
                  )}
                  <div className={showDate ? "" : "flex-1"}>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Duration</label>
                    <div className="flex gap-2 w-auto">
                      <select
                        value={(() => { const d = paperData.header.duration || ''; const m = d.match(/(\d+)\s*Hour/i); return m ? m[1] : ''; })()}
                        onChange={(e) => {
                          const d = paperData.header.duration || '';
                          const minsMatch = d.match(/(\d+)\s*Min/i);
                          const mins = minsMatch ? minsMatch[1] : '';
                          const hrs = e.target.value;
                          let formatted = '';
                          if (hrs) formatted += `${hrs} Hour${parseInt(hrs) > 1 ? 's' : ''}`;
                          if (mins) formatted += ` ${mins} Mins`;
                          handleHeaderChange('duration', formatted.trim());
                        }}
                        className="p-2 text-sm rounded-md"
                        style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                      >
                        <option value="">Hrs</option>
                        {[1, 2, 3, 4, 5].map(h => <option key={h} value={h}>{h} Hr{h > 1 ? 's' : ''}</option>)}
                      </select>
                      <select
                        value={(() => { const d = paperData.header.duration || ''; const m = d.match(/(\d+)\s*Min/i); return m ? m[1] : ''; })()}
                        onChange={(e) => {
                          const d = paperData.header.duration || '';
                          const hrsMatch = d.match(/(\d+)\s*Hour/i);
                          const hrs = hrsMatch ? hrsMatch[1] : '';
                          const mins = e.target.value;
                          let formatted = '';
                          if (hrs) formatted += `${hrs} Hour${parseInt(hrs) > 1 ? 's' : ''}`;
                          if (mins) formatted += ` ${mins} Mins`;
                          handleHeaderChange('duration', formatted.trim());
                        }}
                        className="p-2 text-sm rounded-md"
                        style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }}
                      >
                        <option value="">Mins</option>
                        <option value="15">15 Min</option>
                        <option value="30">30 Min</option>
                        <option value="45">45 Min</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Total Marks</label>
                  <input type="number" value={paperData.header.totalMarks ?? ''} onChange={(e) => handleHeaderChange('totalMarks', parseInt(e.target.value) || 0)} className="w-full p-2 text-sm rounded-md" style={{ border: '1.5px solid #7c8088', color: '#1a1a2e', background: '#f1f3f5' }} />
                </div>
                {/* Institution Logo upload hidden */}
              </div>
            )}
          </div>

          <button onClick={addSection} className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-colors"
            style={{
              background: '#fff',
              color: '#2a7d5f',
              border: '1px dashed #a7d7c5',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f5ee'; e.currentTarget.style.borderStyle = 'solid'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderStyle = 'dashed'; }}
          >
            <Plus size={15} /> Add New Part
          </button>

          {/* Question List Management - All Sections */}
          <div className="space-y-5">
            {paperData.sections.map((section) => (
              <div key={section.id}
                className="p-4 rounded-lg transition-shadow"
                style={{
                  background: activeSectionId === section.id ? '#f0f9f5' : '#f7faf8',
                  border: activeSectionId === section.id ? '1.5px solid #2a7d5f' : '1px solid #d4e5dc',
                  boxShadow: activeSectionId === section.id ? '0 0 0 2px rgba(42, 125, 95, 0.08)' : 'none',
                }}
                onClick={() => setActiveSectionId(section.id)}
              >
                <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid #f1f3f6' }}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>
                      Part {section.part} <span className="font-normal text-xs ml-1" style={{ color: '#6b7280' }}>({section.requiredCount === 'ALL' ? 'Answer ALL' : `Answer any ${section.requiredCount}`})</span>
                    </h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditSection(section.id); }}
                      className="p-1 rounded transition-colors"
                      style={{ color: '#9ca3af' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#2a7d5f')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                      title="Edit Section Settings"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newBreak: Question = {
                          id: crypto.randomUUID(),
                          text: "--- PAGE BREAK ---",
                          marks: 0,
                          type: 'break'
                        };
                        addQuestion(newBreak);
                      }}
                      className="text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
                      style={{ background: '#f1f3f6', color: '#6b7280', border: '1px solid #e2e5ea' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e5ea')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f3f6')}
                      title="Insert Page Break"
                    >
                      <span className="font-mono font-bold text-[10px]">BR</span> Break
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddQuestion(section.id);
                      }}
                      className="text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
                      style={{ background: '#e8f5ee', color: '#2a7d5f', border: '1px solid #a7d7c5' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#d1eddf')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#e8f5ee')}
                    >
                      <Plus size={12} /> Add Question
                    </button>
                  </div>
                </div>

                <ul className="space-y-1.5 text-sm">
                  {section.questions.map((q, i) => (
                    <li
                      key={q.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('sectionId', section.id);
                        e.dataTransfer.setData('questionIndex', i.toString());
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceSectionId = e.dataTransfer.getData('sectionId');
                        const sourceIndex = parseInt(e.dataTransfer.getData('questionIndex'));

                        if (sourceSectionId === section.id && sourceIndex !== i) {
                          const newQuestions = [...section.questions];
                          const [moved] = newQuestions.splice(sourceIndex, 1);
                          newQuestions.splice(i, 0, moved);
                          updateSectionField(section.id, 'questions', newQuestions);
                        }
                      }}
                      className="flex justify-between items-start pb-1.5 cursor-move rounded px-1.5 py-1 transition-colors"
                      style={{
                        borderBottom: '1px solid #f5f6f8',
                        background: editingQuestion?.id === q.id ? '#e8f5ee' : q.type === 'break' ? '#f8f9fb' : 'transparent',
                      }}
                    >
                      <div className="flex flex-col gap-0.5 mr-2 mt-0.5">
                        <button onClick={(e) => { e.stopPropagation(); moveQuestion(section.id, i, 'up'); }} disabled={i === 0} className="disabled:opacity-20 transition-colors" style={{ color: '#9ca3af' }}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.color = '#2a7d5f'; }}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                        >▲</button>
                        <button onClick={(e) => { e.stopPropagation(); moveQuestion(section.id, i, 'down'); }} disabled={i === section.questions.length - 1} className="disabled:opacity-20 transition-colors" style={{ color: '#9ca3af' }}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.color = '#2a7d5f'; }}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                        >▼</button>
                      </div>
                      {q.type === 'break' ? (
                        <div className="flex-1 text-center font-mono text-xs uppercase tracking-widest" style={{ color: '#9ca3af' }}>--- Page Break ---</div>
                      ) : (
                        <span className="truncate flex-1 pt-0.5" style={{ color: '#1a1a2e' }}>
                          {section.questions.filter((x, idx) => idx < i && x.type !== 'break').length + 1}. {q.text}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        {q.type !== 'break' && <span className="font-mono text-[11px] px-1 rounded" style={{ background: '#f1f3f6', color: '#6b7280' }}>[{q.marks}]</span>}
                        {q.type !== 'break' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); editQuestion(q, section.id); }}
                            className="p-1 rounded transition-colors"
                            style={{ color: '#9ca3af' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#2a7d5f')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                            title="Edit Question"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteQuestion(section.id, q.id); }}
                          className="p-1 rounded transition-colors"
                          style={{ color: '#c4c9d1' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#c4c9d1')}
                          title="Delete Question"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                  {section.questions.length === 0 && (
                    <li className="italic text-center py-3 text-sm" style={{ color: '#9ca3af' }}>No questions in this section. Click &quot;Add Question&quot; to start.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Modals */}
        <Modal
          isOpen={showPageSetup}
          onClose={() => setShowPageSetup(false)}
          title="Page Setup"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Display Options</h4>
              <div className="flex items-center justify-between py-2 px-3 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                <label className="text-sm" style={{ color: '#374151' }}>Show CO / PO columns</label>
                <button type="button" onClick={() => setShowBlCoPo(!showBlCoPo)} className="relative w-9 h-5 rounded-full transition-colors" style={{ background: showBlCoPo ? '#2a7d5f' : '#d1d5db' }}>
                  <span className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-all shadow-sm" style={{ left: showBlCoPo ? '18px' : '2px' }} />
                </button>
              </div>

            </div>

            <div style={{ borderTop: '1px solid #e2e5ea', paddingTop: '16px' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Layout Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Line Spacing</label>
                  <input type="number" min="1.0" max="3.0" step="0.1" value={paperData.settings?.lineHeight || 1.5} onChange={(e) => updateSettings('lineHeight', parseFloat(e.target.value))} className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Font Size (pt)</label>
                  <input type="number" min="8" max="24" value={paperData.settings?.fontSize || 12} onChange={(e) => updateSettings('fontSize', parseInt(e.target.value) || 12)} className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Margins (mm)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <input title="Top" type="number" placeholder="Top" value={paperData.settings?.marginTop ?? ''} onChange={(e) => updateSettings('marginTop', parseInt(e.target.value) || 0)} className="p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                    <input title="Bottom" type="number" placeholder="Bottom" value={paperData.settings?.marginBottom ?? ''} onChange={(e) => updateSettings('marginBottom', parseInt(e.target.value) || 0)} className="p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                    <input title="Left" type="number" placeholder="Left" value={paperData.settings?.marginLeft ?? ''} onChange={(e) => updateSettings('marginLeft', parseInt(e.target.value) || 0)} className="p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                    <input title="Right" type="number" placeholder="Right" value={paperData.settings?.marginRight ?? ''} onChange={(e) => updateSettings('marginRight', parseInt(e.target.value) || 0)} className="p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-between items-center" style={{ borderTop: '1px solid #e2e5ea' }}>
              <button onClick={resetSettings} className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#6b7280' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')} onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}>
                <RotateCcw size={12} /> Reset Defaults
              </button>
              <button onClick={() => setShowPageSetup(false)} className="text-white px-4 py-2 rounded-md text-sm transition-colors" style={{ background: '#2a7d5f' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#236b50')} onMouseLeave={(e) => (e.currentTarget.style.background = '#2a7d5f')}>
                Done
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showSectionModal}
          onClose={() => setShowSectionModal(false)}
          title={`Configuration: Part ${paperData.sections.find(s => s.id === activeSectionId)?.part || ''}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Part Name</label>
                <select
                  value={paperData.sections.find(s => s.id === activeSectionId)?.part || 'A'}
                  onChange={(e) => updateSectionField(activeSectionId, 'part', e.target.value)}
                  className="w-full p-2 text-sm rounded-md"
                  style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }}
                >
                  {Array.from({ length: 7 }).map((_, i) => {
                    const char = String.fromCharCode(65 + i);
                    return <option key={char} value={char}>{char}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Questions to Answer</label>
                <select
                  value={paperData.sections.find(s => s.id === activeSectionId)?.requiredCount || 'ALL'}
                  onChange={(e) => updateSectionField(activeSectionId, 'requiredCount', e.target.value)}
                  className="w-full p-2 text-sm rounded-md"
                  style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }}
                >
                  <option value="ALL">Answer ALL</option>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Default Marks per Question</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 2"
                value={paperData.sections.find(s => s.id === activeSectionId)?.defaultMarks || ''}
                onChange={(e) => updateSectionField(activeSectionId, 'defaultMarks', parseInt(e.target.value) || undefined)}
                className="w-full p-2 text-sm rounded-md"
                style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }}
              />
            </div>

            <div className="pt-4 flex justify-between items-center" style={{ borderTop: '1px solid #e2e5ea' }}>
              <button
                onClick={() => deleteSection(activeSectionId)}
                disabled={paperData.sections.length === 1}
                className="px-3 py-2 rounded-md text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ color: '#dc2626' }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 size={15} /> Delete Section
              </button>
              <button
                onClick={() => setShowSectionModal(false)}
                className="text-white px-4 py-2 rounded-md text-sm transition-colors"
                style={{ background: '#2a7d5f' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#236b50')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#2a7d5f')}
              >
                Done
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showQuestionModal}
          onClose={() => setShowQuestionModal(false)}
          title={editingQuestion ? "Edit Question" : "Add New Question"}
        >
          <QuestionForm
            onAddQuestion={addQuestion}
            editingQuestion={editingQuestion}
            onCancelEdit={() => setShowQuestionModal(false)}
            sectionDefaultMarks={paperData.sections.find(s => s.id === activeSectionId)?.defaultMarks}
            showBlCoPo={showBlCoPo}
            autoCapitalize={autoCapitalize}
            allCaps={allCaps}
          />
        </Modal>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-1/2 h-full overflow-y-auto p-8 flex justify-center print:w-full print:bg-white print:p-0 print:overflow-visible" style={{ background: '#eceef2' }}>
        <Preview ref={previewRef} data={paperData} showBlCoPo={showBlCoPo} showWatermark={showWatermark} showLogo={showLogo} watermarkOpacity={watermarkOpacity} logoSize={logoSize} watermarkSize={watermarkSize} showDate={showDate} />
      </div>
    </div>
  );
}
