import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ALL_COURSES = [
  "Medicine & Surgery","Dentistry","Pharmacy","Nursing","Physiotherapy","Radiography",
  "Anatomy","Physiology","Medical Laboratory Science","Biochemistry","Microbiology",
  "Zoology","Botany","Biology","Chemistry","Physics","Mathematics","Statistics",
  "Computer Science","Information Technology","Computer Engineering",
  "Civil Engineering","Electrical Engineering","Mechanical Engineering",
  "Chemical Engineering","Petroleum Engineering","Agricultural Engineering",
  "Biomedical Engineering","Marine Engineering","Systems Engineering",
  "Metallurgical Engineering","Aerospace Engineering","Architecture",
  "Building Technology","Quantity Surveying","Urban & Regional Planning",
  "Estate Management","Surveying & Geoinformatics","Geology","Geophysics",
  "Agriculture","Animal Science","Fisheries & Aquaculture","Forestry & Wildlife",
  "Food Science & Technology","Soil Science",
  "Accounting","Banking & Finance","Business Administration","Economics",
  "Marketing","Insurance","Actuarial Science","Public Administration",
  "Political Science","Sociology","Psychology","Social Work",
  "International Relations","Mass Communication","Journalism",
  "Law","English Language","History & International Studies","Philosophy",
  "Religious Studies","Theatre Arts","Music","Fine & Applied Arts",
  "French","Linguistics","Library & Information Science",
  "Education & English","Education & Mathematics","Education & Biology",
  "Education & Chemistry","Education & Physics","Education & Economics",
  "Physical & Health Education",
].sort();

const UNIVERSITIES = {
  UNILAG: {
    name:"University of Lagos", short:"UNILAG", type:"Federal", location:"Lagos",
    jamb_cutoff:200, post_utme_questions:40, post_utme_time:30,
    formula:(j,p)=>(j/8)+(p/2), max_aggregate:85,
    courses:{
      "Medicine & Surgery":{cutoff:280,agg:75,competition:"Very High"},
      "Dentistry":{cutoff:275,agg:74,competition:"Very High"},
      "Pharmacy":{cutoff:260,agg:70,competition:"Very High"},
      "Physiotherapy":{cutoff:250,agg:68,competition:"High"},
      "Radiography":{cutoff:240,agg:65,competition:"High"},
      "Nursing":{cutoff:240,agg:64,competition:"High"},
      "Medical Laboratory Science":{cutoff:230,agg:63,competition:"High"},
      "Anatomy":{cutoff:240,agg:65,competition:"High"},
      "Physiology":{cutoff:235,agg:64,competition:"High"},
      "Biochemistry":{cutoff:220,agg:60,competition:"High"},
      "Microbiology":{cutoff:215,agg:58,competition:"Medium"},
      "Zoology":{cutoff:200,agg:54,competition:"Medium"},
      "Botany":{cutoff:200,agg:52,competition:"Low"},
      "Chemistry":{cutoff:200,agg:54,competition:"Medium"},
      "Physics":{cutoff:200,agg:52,competition:"Medium"},
      "Mathematics":{cutoff:200,agg:53,competition:"Medium"},
      "Statistics":{cutoff:200,agg:52,competition:"Medium"},
      "Computer Science":{cutoff:230,agg:63,competition:"High"},
      "Information Technology":{cutoff:220,agg:60,competition:"High"},
      "Computer Engineering":{cutoff:240,agg:65,competition:"High"},
      "Civil Engineering":{cutoff:240,agg:65,competition:"High"},
      "Electrical Engineering":{cutoff:240,agg:65,competition:"High"},
      "Mechanical Engineering":{cutoff:235,agg:64,competition:"High"},
      "Chemical Engineering":{cutoff:235,agg:63,competition:"High"},
      "Petroleum Engineering":{cutoff:245,agg:66,competition:"High"},
      "Systems Engineering":{cutoff:235,agg:63,competition:"High"},
      "Biomedical Engineering":{cutoff:240,agg:64,competition:"High"},
      "Architecture":{cutoff:220,agg:60,competition:"High"},
      "Building Technology":{cutoff:200,agg:54,competition:"Medium"},
      "Estate Management":{cutoff:200,agg:54,competition:"Medium"},
      "Quantity Surveying":{cutoff:200,agg:53,competition:"Medium"},
      "Urban & Regional Planning":{cutoff:200,agg:52,competition:"Medium"},
      "Surveying & Geoinformatics":{cutoff:200,agg:52,competition:"Medium"},
      "Law":{cutoff:270,agg:72,competition:"Very High"},
      "Accounting":{cutoff:220,agg:62,competition:"High"},
      "Actuarial Science":{cutoff:220,agg:61,competition:"High"},
      "Banking & Finance":{cutoff:210,agg:59,competition:"Medium"},
      "Business Administration":{cutoff:210,agg:58,competition:"Medium"},
      "Economics":{cutoff:210,agg:58,competition:"Medium"},
      "Marketing":{cutoff:200,agg:55,competition:"Medium"},
      "Insurance":{cutoff:200,agg:54,competition:"Medium"},
      "Public Administration":{cutoff:200,agg:52,competition:"Low"},
      "Political Science":{cutoff:200,agg:52,competition:"Medium"},
      "Sociology":{cutoff:200,agg:51,competition:"Low"},
      "Psychology":{cutoff:200,agg:51,competition:"Medium"},
      "Social Work":{cutoff:200,agg:50,competition:"Low"},
      "International Relations":{cutoff:200,agg:53,competition:"Medium"},
      "Mass Communication":{cutoff:200,agg:55,competition:"Medium"},
      "Journalism":{cutoff:200,agg:54,competition:"Medium"},
      "English Language":{cutoff:200,agg:50,competition:"Low"},
      "History & International Studies":{cutoff:200,agg:49,competition:"Low"},
      "Philosophy":{cutoff:200,agg:48,competition:"Low"},
      "Religious Studies":{cutoff:200,agg:47,competition:"Low"},
      "Theatre Arts":{cutoff:200,agg:47,competition:"Low"},
      "Fine & Applied Arts":{cutoff:200,agg:46,competition:"Low"},
      "Music":{cutoff:200,agg:46,competition:"Low"},
      "French":{cutoff:200,agg:47,competition:"Low"},
      "Linguistics":{cutoff:200,agg:47,competition:"Low"},
      "Agriculture":{cutoff:200,agg:48,competition:"Low"},
      "Food Science & Technology":{cutoff:200,agg:50,competition:"Medium"},
      "Education & Mathematics":{cutoff:200,agg:49,competition:"Low"},
      "Education & English":{cutoff:200,agg:48,competition:"Low"},
      "Education & Biology":{cutoff:200,agg:48,competition:"Low"},
      "Education & Economics":{cutoff:200,agg:48,competition:"Low"},
      "Library & Information Science":{cutoff:200,agg:47,competition:"Low"},
    }
  },
  UI:{
    name:"University of Ibadan",short:"UI",type:"Federal",location:"Oyo",
    jamb_cutoff:200,post_utme_questions:100,post_utme_time:90,
    formula:(j,p)=>(j/8)+(p/2),max_aggregate:90,
    courses:{
      "Medicine & Surgery":{cutoff:270,agg:74,competition:"Very High"},
      "Dentistry":{cutoff:265,agg:72,competition:"Very High"},
      "Pharmacy":{cutoff:255,agg:70,competition:"Very High"},
      "Physiotherapy":{cutoff:245,agg:67,competition:"High"},
      "Nursing":{cutoff:235,agg:64,competition:"High"},
      "Medical Laboratory Science":{cutoff:225,agg:62,competition:"High"},
      "Anatomy":{cutoff:240,agg:65,competition:"High"},
      "Physiology":{cutoff:235,agg:64,competition:"High"},
      "Biochemistry":{cutoff:220,agg:61,competition:"High"},
      "Microbiology":{cutoff:210,agg:58,competition:"Medium"},
      "Zoology":{cutoff:200,agg:53,competition:"Medium"},
      "Botany":{cutoff:200,agg:52,competition:"Low"},
      "Chemistry":{cutoff:200,agg:54,competition:"Medium"},
      "Physics":{cutoff:200,agg:53,competition:"Medium"},
      "Mathematics":{cutoff:200,agg:54,competition:"Medium"},
      "Statistics":{cutoff:200,agg:53,competition:"Medium"},
      "Computer Science":{cutoff:220,agg:61,competition:"High"},
      "Civil Engineering":{cutoff:230,agg:63,competition:"High"},
      "Electrical Engineering":{cutoff:228,agg:63,competition:"High"},
      "Mechanical Engineering":{cutoff:225,agg:62,competition:"High"},
      "Chemical Engineering":{cutoff:225,agg:62,competition:"High"},
      "Computer Engineering":{cutoff:228,agg:63,competition:"High"},
      "Architecture":{cutoff:210,agg:57,competition:"Medium"},
      "Urban & Regional Planning":{cutoff:200,agg:52,competition:"Medium"},
      "Estate Management":{cutoff:200,agg:51,competition:"Medium"},
      "Quantity Surveying":{cutoff:200,agg:51,competition:"Medium"},
      "Law":{cutoff:260,agg:71,competition:"Very High"},
      "Accounting":{cutoff:215,agg:60,competition:"High"},
      "Economics":{cutoff:210,agg:57,competition:"Medium"},
      "Business Administration":{cutoff:210,agg:56,competition:"Medium"},
      "Political Science":{cutoff:200,agg:53,competition:"Medium"},
      "Sociology":{cutoff:200,agg:51,competition:"Low"},
      "Psychology":{cutoff:200,agg:52,competition:"Medium"},
      "International Relations":{cutoff:200,agg:52,competition:"Medium"},
      "Mass Communication":{cutoff:200,agg:53,competition:"Medium"},
      "English Language":{cutoff:200,agg:49,competition:"Low"},
      "History & International Studies":{cutoff:200,agg:48,competition:"Low"},
      "Philosophy":{cutoff:200,agg:47,competition:"Low"},
      "Religious Studies":{cutoff:200,agg:46,competition:"Low"},
      "Linguistics":{cutoff:200,agg:47,competition:"Low"},
      "Theatre Arts":{cutoff:200,agg:46,competition:"Low"},
      "Fine & Applied Arts":{cutoff:200,agg:46,competition:"Low"},
      "Music":{cutoff:200,agg:45,competition:"Low"},
      "Agriculture":{cutoff:200,agg:50,competition:"Low"},
      "Animal Science":{cutoff:200,agg:49,competition:"Low"},
      "Forestry & Wildlife":{cutoff:200,agg:48,competition:"Low"},
      "Food Science & Technology":{cutoff:200,agg:51,competition:"Medium"},
      "Fisheries & Aquaculture":{cutoff:200,agg:48,competition:"Low"},
      "Geology":{cutoff:200,agg:52,competition:"Medium"},
      "Education & Mathematics":{cutoff:200,agg:48,competition:"Low"},
      "Education & English":{cutoff:200,agg:48,competition:"Low"},
      "Education & Biology":{cutoff:200,agg:48,competition:"Low"},
      "Education & Chemistry":{cutoff:200,agg:48,competition:"Low"},
      "Education & Physics":{cutoff:200,agg:47,competition:"Low"},
      "Library & Information Science":{cutoff:200,agg:47,competition:"Low"},
      "Physical & Health Education":{cutoff:200,agg:46,competition:"Low"},
    }
  },
  OAU:{
    name:"Obafemi Awolowo University",short:"OAU",type:"Federal",location:"Osun",
    jamb_cutoff:200,post_utme_questions:100,post_utme_time:60,
    formula:(j,p)=>(j/8)+(p/2),max_aggregate:90,
    courses:{
      "Medicine & Surgery":{cutoff:270,agg:74,competition:"Very High"},
      "Dentistry":{cutoff:265,agg:72,competition:"Very High"},
      "Pharmacy":{cutoff:255,agg:70,competition:"Very High"},
      "Physiotherapy":{cutoff:240,agg:66,competition:"High"},
      "Medical Laboratory Science":{cutoff:225,agg:62,competition:"High"},
      "Anatomy":{cutoff:238,agg:65,competition:"High"},
      "Biochemistry":{cutoff:220,agg:62,competition:"High"},
      "Microbiology":{cutoff:210,agg:58,competition:"Medium"},
      "Zoology":{cutoff:200,agg:53,competition:"Medium"},
      "Botany":{cutoff:200,agg:51,competition:"Low"},
      "Chemistry":{cutoff:200,agg:54,competition:"Medium"},
      "Physics":{cutoff:200,agg:52,competition:"Medium"},
      "Mathematics":{cutoff:200,agg:53,competition:"Medium"},
      "Statistics":{cutoff:200,agg:52,competition:"Medium"},
      "Geology":{cutoff:200,agg:52,competition:"Medium"},
      "Computer Science":{cutoff:220,agg:61,competition:"High"},
      "Computer Engineering":{cutoff:225,agg:62,competition:"High"},
      "Civil Engineering":{cutoff:230,agg:63,competition:"High"},
      "Electrical Engineering":{cutoff:228,agg:62,competition:"High"},
      "Mechanical Engineering":{cutoff:225,agg:62,competition:"High"},
      "Chemical Engineering":{cutoff:225,agg:62,competition:"High"},
      "Agricultural Engineering":{cutoff:200,agg:54,competition:"Medium"},
      "Architecture":{cutoff:240,agg:65,competition:"High"},
      "Building Technology":{cutoff:200,agg:51,competition:"Medium"},
      "Estate Management":{cutoff:200,agg:51,competition:"Medium"},
      "Quantity Surveying":{cutoff:200,agg:51,competition:"Medium"},
      "Urban & Regional Planning":{cutoff:200,agg:52,competition:"Medium"},
      "Surveying & Geoinformatics":{cutoff:200,agg:51,competition:"Medium"},
      "Law":{cutoff:260,agg:71,competition:"Very High"},
      "Accounting":{cutoff:215,agg:60,competition:"High"},
      "Economics":{cutoff:210,agg:57,competition:"Medium"},
      "Business Administration":{cutoff:205,agg:56,competition:"Medium"},
      "Banking & Finance":{cutoff:205,agg:55,competition:"Medium"},
      "International Relations":{cutoff:205,agg:55,competition:"Medium"},
      "Political Science":{cutoff:200,agg:53,competition:"Medium"},
      "Sociology":{cutoff:200,agg:51,competition:"Low"},
      "Psychology":{cutoff:200,agg:52,competition:"Medium"},
      "Social Work":{cutoff:200,agg:50,competition:"Low"},
      "Mass Communication":{cutoff:200,agg:53,competition:"Medium"},
      "English Language":{cutoff:200,agg:49,competition:"Low"},
      "History & International Studies":{cutoff:200,agg:48,competition:"Low"},
      "Philosophy":{cutoff:200,agg:47,competition:"Low"},
      "Religious Studies":{cutoff:200,agg:46,competition:"Low"},
      "Theatre Arts":{cutoff:200,agg:47,competition:"Low"},
      "Fine & Applied Arts":{cutoff:200,agg:46,competition:"Low"},
      "Music":{cutoff:200,agg:45,competition:"Low"},
      "Linguistics":{cutoff:200,agg:47,competition:"Low"},
      "Agriculture":{cutoff:200,agg:49,competition:"Low"},
      "Animal Science":{cutoff:200,agg:48,competition:"Low"},
      "Food Science & Technology":{cutoff:200,agg:51,competition:"Medium"},
      "Forestry & Wildlife":{cutoff:200,agg:48,competition:"Low"},
      "Education & Mathematics":{cutoff:200,agg:48,competition:"Low"},
      "Education & English":{cutoff:200,agg:47,competition:"Low"},
      "Education & Biology":{cutoff:200,agg:48,competition:"Low"},
      "Education & Chemistry":{cutoff:200,agg:48,competition:"Low"},
      "Education & Physics":{cutoff:200,agg:47,competition:"Low"},
      "Education & Economics":{cutoff:200,agg:47,competition:"Low"},
      "Library & Information Science":{cutoff:200,agg:47,competition:"Low"},
    }
  },
  UNIBEN:{
    name:"University of Benin",short:"UNIBEN",type:"Federal",location:"Edo",
    jamb_cutoff:180,post_utme_questions:100,post_utme_time:60,
    formula:(j,p)=>(j/8)+(p/2),max_aggregate:100,
    courses:{
      "Medicine & Surgery":{cutoff:260,agg:70,competition:"Very High"},
      "Dentistry":{cutoff:250,agg:68,competition:"Very High"},
      "Pharmacy":{cutoff:245,agg:66,competition:"High"},
      "Nursing":{cutoff:230,agg:63,competition:"High"},
      "Medical Laboratory Science":{cutoff:220,agg:60,competition:"High"},
      "Physiotherapy":{cutoff:230,agg:63,competition:"High"},
      "Anatomy":{cutoff:235,agg:64,competition:"High"},
      "Biochemistry":{cutoff:200,agg:56,competition:"Medium"},
      "Microbiology":{cutoff:195,agg:54,competition:"Medium"},
      "Zoology":{cutoff:180,agg:49,competition:"Low"},
      "Chemistry":{cutoff:180,agg:51,competition:"Low"},
      "Physics":{cutoff:180,agg:50,competition:"Low"},
      "Mathematics":{cutoff:180,agg:50,competition:"Low"},
      "Statistics":{cutoff:180,agg:49,competition:"Low"},
      "Computer Science":{cutoff:200,agg:56,competition:"Medium"},
      "Computer Engineering":{cutoff:210,agg:58,competition:"High"},
      "Civil Engineering":{cutoff:220,agg:60,competition:"High"},
      "Electrical Engineering":{cutoff:215,agg:59,competition:"High"},
      "Mechanical Engineering":{cutoff:210,agg:58,competition:"High"},
      "Chemical Engineering":{cutoff:210,agg:58,competition:"High"},
      "Petroleum Engineering":{cutoff:220,agg:60,competition:"High"},
      "Agricultural Engineering":{cutoff:185,agg:52,competition:"Low"},
      "Architecture":{cutoff:200,agg:56,competition:"Medium"},
      "Building Technology":{cutoff:180,agg:49,competition:"Low"},
      "Estate Management":{cutoff:180,agg:50,competition:"Low"},
      "Quantity Surveying":{cutoff:180,agg:49,competition:"Low"},
      "Urban & Regional Planning":{cutoff:180,agg:49,competition:"Low"},
      "Surveying & Geoinformatics":{cutoff:180,agg:49,competition:"Low"},
      "Geology":{cutoff:180,agg:50,competition:"Low"},
      "Geophysics":{cutoff:180,agg:50,competition:"Low"},
      "Law":{cutoff:250,agg:68,competition:"Very High"},
      "Accounting":{cutoff:200,agg:57,competition:"Medium"},
      "Banking & Finance":{cutoff:185,agg:52,competition:"Medium"},
      "Economics":{cutoff:190,agg:54,competition:"Medium"},
      "Business Administration":{cutoff:190,agg:53,competition:"Medium"},
      "Marketing":{cutoff:180,agg:50,competition:"Low"},
      "Insurance":{cutoff:180,agg:49,competition:"Low"},
      "Public Administration":{cutoff:180,agg:49,competition:"Low"},
      "Political Science":{cutoff:180,agg:50,competition:"Low"},
      "Sociology":{cutoff:180,agg:49,competition:"Low"},
      "Psychology":{cutoff:180,agg:50,competition:"Low"},
      "Mass Communication":{cutoff:180,agg:51,competition:"Medium"},
      "Journalism":{cutoff:180,agg:50,competition:"Low"},
      "English Language":{cutoff:180,agg:48,competition:"Low"},
      "History & International Studies":{cutoff:180,agg:47,competition:"Low"},
      "Philosophy":{cutoff:180,agg:46,competition:"Low"},
      "Religious Studies":{cutoff:180,agg:45,competition:"Low"},
      "Theatre Arts":{cutoff:180,agg:46,competition:"Low"},
      "Fine & Applied Arts":{cutoff:180,agg:45,competition:"Low"},
      "Linguistics":{cutoff:180,agg:46,competition:"Low"},
      "Agriculture":{cutoff:180,agg:48,competition:"Low"},
      "Animal Science":{cutoff:180,agg:47,competition:"Low"},
      "Food Science & Technology":{cutoff:180,agg:49,competition:"Low"},
      "Education & Mathematics":{cutoff:180,agg:47,competition:"Low"},
      "Education & English":{cutoff:180,agg:47,competition:"Low"},
      "Education & Biology":{cutoff:180,agg:47,competition:"Low"},
      "Education & Chemistry":{cutoff:180,agg:47,competition:"Low"},
      "Education & Physics":{cutoff:180,agg:47,competition:"Low"},
      "Library & Information Science":{cutoff:180,agg:46,competition:"Low"},
      "Physical & Health Education":{cutoff:180,agg:45,competition:"Low"},
    }
  },
  ABU:{
    name:"Ahmadu Bello University",short:"ABU",type:"Federal",location:"Kaduna",
    jamb_cutoff:180,post_utme_questions:60,post_utme_time:45,
    formula:(j,p)=>(j/8)+(p/2),max_aggregate:90,
    courses:{
      "Medicine & Surgery":{cutoff:250,agg:68,competition:"Very High"},
      "Pharmacy":{cutoff:240,agg:65,competition:"High"},
      "Dentistry":{cutoff:245,agg:66,competition:"High"},
      "Nursing":{cutoff:225,agg:62,competition:"High"},
      "Medical Laboratory Science":{cutoff:215,agg:59,competition:"High"},
      "Biochemistry":{cutoff:200,agg:55,competition:"Medium"},
      "Microbiology":{cutoff:190,agg:53,competition:"Medium"},
      "Mathematics":{cutoff:180,agg:49,competition:"Low"},
      "Physics":{cutoff:180,agg:49,competition:"Low"},
      "Chemistry":{cutoff:180,agg:50,competition:"Low"},
      "Statistics":{cutoff:180,agg:48,competition:"Low"},
      "Computer Science":{cutoff:200,agg:55,competition:"Medium"},
      "Computer Engineering":{cutoff:210,agg:57,competition:"High"},
      "Civil Engineering":{cutoff:220,agg:60,competition:"High"},
      "Electrical Engineering":{cutoff:215,agg:59,competition:"High"},
      "Mechanical Engineering":{cutoff:210,agg:58,competition:"High"},
      "Chemical Engineering":{cutoff:210,agg:58,competition:"High"},
      "Agricultural Engineering":{cutoff:190,agg:53,competition:"Medium"},
      "Architecture":{cutoff:200,agg:55,competition:"Medium"},
      "Quantity Surveying":{cutoff:180,agg:49,competition:"Low"},
      "Urban & Regional Planning":{cutoff:180,agg:49,competition:"Low"},
      "Law":{cutoff:240,agg:65,competition:"Very High"},
      "Accounting":{cutoff:200,agg:56,competition:"Medium"},
      "Economics":{cutoff:190,agg:53,competition:"Medium"},
      "Business Administration":{cutoff:185,agg:52,competition:"Medium"},
      "Banking & Finance":{cutoff:185,agg:51,competition:"Medium"},
      "Political Science":{cutoff:180,agg:49,competition:"Low"},
      "Sociology":{cutoff:180,agg:48,competition:"Low"},
      "Psychology":{cutoff:180,agg:48,competition:"Low"},
      "Public Administration":{cutoff:180,agg:48,competition:"Low"},
      "Social Work":{cutoff:180,agg:47,competition:"Low"},
      "Mass Communication":{cutoff:180,agg:50,competition:"Low"},
      "English Language":{cutoff:180,agg:47,competition:"Low"},
      "History & International Studies":{cutoff:180,agg:46,competition:"Low"},
      "Philosophy":{cutoff:180,agg:46,competition:"Low"},
      "Religious Studies":{cutoff:180,agg:45,competition:"Low"},
      "Fine & Applied Arts":{cutoff:180,agg:45,competition:"Low"},
      "Agriculture":{cutoff:180,agg:48,competition:"Low"},
      "Animal Science":{cutoff:180,agg:47,competition:"Low"},
      "Forestry & Wildlife":{cutoff:180,agg:47,competition:"Low"},
      "Food Science & Technology":{cutoff:180,agg:48,competition:"Low"},
      "Fisheries & Aquaculture":{cutoff:180,agg:46,competition:"Low"},
      "Geology":{cutoff:180,agg:49,competition:"Low"},
      "Geophysics":{cutoff:180,agg:49,competition:"Low"},
      "Education & Mathematics":{cutoff:180,agg:46,competition:"Low"},
      "Education & English":{cutoff:180,agg:46,competition:"Low"},
      "Education & Biology":{cutoff:180,agg:46,competition:"Low"},
      "Education & Chemistry":{cutoff:180,agg:46,competition:"Low"},
      "Education & Physics":{cutoff:180,agg:46,competition:"Low"},
      "Education & Economics":{cutoff:180,agg:46,competition:"Low"},
      "Library & Information Science":{cutoff:180,agg:45,competition:"Low"},
      "Physical & Health Education":{cutoff:180,agg:45,competition:"Low"},
    }
  },
  UNN:{
    name:"University of Nigeria, Nsukka",short:"UNN",type:"Federal",location:"Enugu",
    jamb_cutoff:180,post_utme_questions:60,post_utme_time:45,
    formula:(j,p)=>(j/8)+(p/2),max_aggregate:90,
    courses:{
      "Medicine & Surgery":{cutoff:260,agg:72,competition:"Very High"},
      "Pharmacy":{cutoff:240,agg:66,competition:"High"},
      "Dentistry":{cutoff:245,agg:67,competition:"High"},
      "Nursing":{cutoff:225,agg:62,competition:"High"},
      "Medical Laboratory Science":{cutoff:215,agg:59,competition:"High"},
      "Biochemistry":{cutoff:200,agg:55,competition:"Medium"},
      "Microbiology":{cutoff:190,agg:53,competition:"Medium"},
      "Zoology":{cutoff:180,agg:49,competition:"Low"},
      "Botany":{cutoff:180,agg:48,competition:"Low"},
      "Chemistry":{cutoff:180,agg:50,competition:"Low"},
      "Physics":{cutoff:180,agg:49,competition:"Low"},
      "Mathematics":{cutoff:180,agg:49,competition:"Low"},
      "Statistics":{cutoff:180,agg:48,competition:"Low"},
      "Computer Science":{cutoff:200,agg:55,competition:"Medium"},
      "Computer Engineering":{cutoff:210,agg:58,competition:"High"},
      "Civil Engineering":{cutoff:215,agg:59,competition:"High"},
      "Electrical Engineering":{cutoff:210,agg:58,competition:"High"},
      "Mechanical Engineering":{cutoff:208,agg:57,competition:"High"},
      "Chemical Engineering":{cutoff:205,agg:57,competition:"High"},
      "Architecture":{cutoff:200,agg:55,competition:"Medium"},
      "Estate Management":{cutoff:180,agg:49,competition:"Low"},
      "Quantity Surveying":{cutoff:180,agg:48,competition:"Low"},
      "Urban & Regional Planning":{cutoff:180,agg:49,competition:"Low"},
      "Law":{cutoff:240,agg:66,competition:"Very High"},
      "Accounting":{cutoff:200,agg:56,competition:"Medium"},
      "Banking & Finance":{cutoff:195,agg:54,competition:"Medium"},
      "Economics":{cutoff:190,agg:53,competition:"Medium"},
      "Business Administration":{cutoff:190,agg:52,competition:"Medium"},
      "Marketing":{cutoff:185,agg:51,competition:"Medium"},
      "Public Administration":{cutoff:180,agg:49,competition:"Low"},
      "Political Science":{cutoff:180,agg:49,competition:"Low"},
      "Sociology":{cutoff:180,agg:48,competition:"Low"},
      "Psychology":{cutoff:180,agg:49,competition:"Low"},
      "Mass Communication":{cutoff:185,agg:51,competition:"Medium"},
      "Journalism":{cutoff:180,agg:50,competition:"Low"},
      "English Language":{cutoff:180,agg:47,competition:"Low"},
      "History & International Studies":{cutoff:180,agg:46,competition:"Low"},
      "Philosophy":{cutoff:180,agg:46,competition:"Low"},
      "Religious Studies":{cutoff:180,agg:45,competition:"Low"},
      "Fine & Applied Arts":{cutoff:180,agg:45,competition:"Low"},
      "Theatre Arts":{cutoff:180,agg:46,competition:"Low"},
      "Music":{cutoff:180,agg:45,competition:"Low"},
      "Linguistics":{cutoff:180,agg:46,competition:"Low"},
      "Agriculture":{cutoff:180,agg:47,competition:"Low"},
      "Animal Science":{cutoff:180,agg:47,competition:"Low"},
      "Food Science & Technology":{cutoff:180,agg:49,competition:"Low"},
      "Geology":{cutoff:180,agg:49,competition:"Low"},
      "Education & Mathematics":{cutoff:180,agg:46,competition:"Low"},
      "Education & English":{cutoff:180,agg:46,competition:"Low"},
      "Education & Biology":{cutoff:180,agg:46,competition:"Low"},
      "Education & Chemistry":{cutoff:180,agg:46,competition:"Low"},
      "Education & Physics":{cutoff:180,agg:46,competition:"Low"},
      "Library & Information Science":{cutoff:180,agg:46,competition:"Low"},
    }
  },
  UNIPORT:{
    name:"University of Port Harcourt",short:"UNIPORT",type:"Federal",location:"Rivers",
    jamb_cutoff:180,post_utme_questions:60,post_utme_time:45,
    formula:(j,p)=>(j/8)+(p/2),max_aggregate:90,
    courses:{
      "Medicine & Surgery":{cutoff:250,agg:68,competition:"Very High"},
      "Pharmacy":{cutoff:235,agg:64,competition:"High"},
      "Nursing":{cutoff:225,agg:62,competition:"High"},
      "Medical Laboratory Science":{cutoff:215,agg:59,competition:"High"},
      "Biochemistry":{cutoff:190,agg:53,competition:"Medium"},
      "Microbiology":{cutoff:185,agg:52,competition:"Medium"},
      "Chemistry":{cutoff:180,agg:49,competition:"Low"},
      "Physics":{cutoff:180,agg:48,competition:"Low"},
      "Mathematics":{cutoff:180,agg:48,competition:"Low"},
      "Geology":{cutoff:180,agg:50,competition:"Low"},
      "Geophysics":{cutoff:180,agg:50,competition:"Low"},
      "Computer Science":{cutoff:190,agg:53,competition:"Medium"},
      "Computer Engineering":{cutoff:200,agg:55,competition:"Medium"},
      "Civil Engineering":{cutoff:215,agg:59,competition:"High"},
      "Electrical Engineering":{cutoff:210,agg:58,competition:"High"},
      "Mechanical Engineering":{cutoff:210,agg:58,competition:"High"},
      "Chemical Engineering":{cutoff:210,agg:58,competition:"High"},
      "Petroleum Engineering":{cutoff:240,agg:65,competition:"Very High"},
      "Marine Engineering":{cutoff:210,agg:58,competition:"High"},
      "Architecture":{cutoff:195,agg:53,competition:"Medium"},
      "Estate Management":{cutoff:180,agg:49,competition:"Low"},
      "Law":{cutoff:230,agg:63,competition:"High"},
      "Accounting":{cutoff:185,agg:52,competition:"Medium"},
      "Banking & Finance":{cutoff:180,agg:50,competition:"Medium"},
      "Economics":{cutoff:180,agg:50,competition:"Medium"},
      "Business Administration":{cutoff:180,agg:50,competition:"Medium"},
      "Political Science":{cutoff:180,agg:48,competition:"Low"},
      "Sociology":{cutoff:180,agg:47,competition:"Low"},
      "Mass Communication":{cutoff:180,agg:50,competition:"Medium"},
      "English Language":{cutoff:180,agg:46,competition:"Low"},
      "History & International Studies":{cutoff:180,agg:46,competition:"Low"},
      "Agriculture":{cutoff:180,agg:46,competition:"Low"},
      "Fisheries & Aquaculture":{cutoff:180,agg:46,competition:"Low"},
      "Education & Mathematics":{cutoff:180,agg:46,competition:"Low"},
      "Education & English":{cutoff:180,agg:45,competition:"Low"},
      "Education & Biology":{cutoff:180,agg:46,competition:"Low"},
    }
  },
  UNILORIN:{
    name:"University of Ilorin",short:"UNILORIN",type:"Federal",location:"Kwara",
    jamb_cutoff:180,post_utme_questions:60,post_utme_time:45,
    formula:(j,p)=>(j/8)+(p/2),max_aggregate:90,
    courses:{
      "Medicine & Surgery":{cutoff:260,agg:70,competition:"Very High"},
      "Pharmacy":{cutoff:240,agg:65,competition:"High"},
      "Nursing":{cutoff:225,agg:61,competition:"High"},
      "Medical Laboratory Science":{cutoff:215,agg:58,competition:"High"},
      "Biochemistry":{cutoff:195,agg:54,competition:"Medium"},
      "Microbiology":{cutoff:185,agg:52,competition:"Medium"},
      "Chemistry":{cutoff:180,agg:49,competition:"Low"},
      "Physics":{cutoff:180,agg:48,competition:"Low"},
      "Mathematics":{cutoff:180,agg:48,competition:"Low"},
      "Computer Science":{cutoff:190,agg:53,competition:"Medium"},
      "Civil Engineering":{cutoff:210,agg:57,competition:"High"},
      "Electrical Engineering":{cutoff:205,agg:56,competition:"High"},
      "Mechanical Engineering":{cutoff:205,agg:56,competition:"High"},
      "Chemical Engineering":{cutoff:200,agg:55,competition:"Medium"},
      "Computer Engineering":{cutoff:205,agg:56,competition:"High"},
      "Law":{cutoff:245,agg:66,competition:"Very High"},
      "Accounting":{cutoff:200,agg:56,competition:"Medium"},
      "Economics":{cutoff:190,agg:53,competition:"Medium"},
      "Business Administration":{cutoff:185,agg:52,competition:"Medium"},
      "Banking & Finance":{cutoff:185,agg:51,competition:"Medium"},
      "Political Science":{cutoff:180,agg:49,competition:"Low"},
      "Sociology":{cutoff:180,agg:48,competition:"Low"},
      "Mass Communication":{cutoff:180,agg:50,competition:"Medium"},
      "English Language":{cutoff:180,agg:46,competition:"Low"},
      "History & International Studies":{cutoff:180,agg:46,competition:"Low"},
      "Philosophy":{cutoff:180,agg:46,competition:"Low"},
      "Religious Studies":{cutoff:180,agg:44,competition:"Low"},
      "Agriculture":{cutoff:180,agg:46,competition:"Low"},
      "Education & Mathematics":{cutoff:180,agg:46,competition:"Low"},
      "Education & English":{cutoff:180,agg:45,competition:"Low"},
      "Education & Biology":{cutoff:180,agg:46,competition:"Low"},
      "Education & Chemistry":{cutoff:180,agg:46,competition:"Low"},
      "Education & Physics":{cutoff:180,agg:46,competition:"Low"},
      "Library & Information Science":{cutoff:180,agg:45,competition:"Low"},
    }
  },
  LASU:{
    name:"Lagos State University",short:"LASU",type:"State",location:"Lagos",
    jamb_cutoff:160,post_utme_questions:60,post_utme_time:60,
    formula:(j,p)=>(j/8)+(p/2),max_aggregate:85,
    courses:{
      "Medicine & Surgery":{cutoff:240,agg:65,competition:"Very High"},
      "Pharmacy":{cutoff:225,agg:62,competition:"High"},
      "Nursing":{cutoff:210,agg:58,competition:"High"},
      "Law":{cutoff:220,agg:60,competition:"High"},
      "Accounting":{cutoff:200,agg:55,competition:"Medium"},
      "Banking & Finance":{cutoff:195,agg:54,competition:"Medium"},
      "Economics":{cutoff:185,agg:52,competition:"Medium"},
      "Business Administration":{cutoff:180,agg:51,competition:"Medium"},
      "Marketing":{cutoff:175,agg:50,competition:"Medium"},
      "Public Administration":{cutoff:165,agg:47,competition:"Low"},
      "Political Science":{cutoff:165,agg:47,competition:"Low"},
      "Sociology":{cutoff:160,agg:45,competition:"Low"},
      "Mass Communication":{cutoff:175,agg:50,competition:"Medium"},
      "Civil Engineering":{cutoff:195,agg:53,competition:"Medium"},
      "Electrical Engineering":{cutoff:190,agg:52,competition:"Medium"},
      "Mechanical Engineering":{cutoff:188,agg:51,competition:"Medium"},
      "Computer Science":{cutoff:180,agg:50,competition:"Medium"},
      "Computer Engineering":{cutoff:185,agg:51,competition:"Medium"},
      "Architecture":{cutoff:185,agg:52,competition:"Medium"},
      "Estate Management":{cutoff:165,agg:46,competition:"Low"},
      "Quantity Surveying":{cutoff:165,agg:46,competition:"Low"},
      "Biochemistry":{cutoff:175,agg:50,competition:"Low"},
      "Microbiology":{cutoff:170,agg:49,competition:"Low"},
      "Mathematics":{cutoff:160,agg:45,competition:"Low"},
      "Physics":{cutoff:160,agg:44,competition:"Low"},
      "Chemistry":{cutoff:160,agg:45,competition:"Low"},
      "English Language":{cutoff:160,agg:44,competition:"Low"},
      "History & International Studies":{cutoff:160,agg:43,competition:"Low"},
      "Education & English":{cutoff:160,agg:43,competition:"Low"},
      "Education & Mathematics":{cutoff:160,agg:43,competition:"Low"},
    }
  },
  COVENANT:{
    name:"Covenant University",short:"Covenant",type:"Private",location:"Ogun",
    jamb_cutoff:150,post_utme_questions:50,post_utme_time:45,
    formula:(j,p)=>(j/8)+(p/2),max_aggregate:80,
    courses:{
      "Civil Engineering":{cutoff:195,agg:56,competition:"Medium"},
      "Electrical Engineering":{cutoff:200,agg:58,competition:"High"},
      "Mechanical Engineering":{cutoff:195,agg:56,competition:"Medium"},
      "Chemical Engineering":{cutoff:190,agg:55,competition:"Medium"},
      "Computer Engineering":{cutoff:200,agg:58,competition:"High"},
      "Computer Science":{cutoff:190,agg:55,competition:"Medium"},
      "Information Technology":{cutoff:185,agg:54,competition:"Medium"},
      "Architecture":{cutoff:185,agg:54,competition:"Medium"},
      "Estate Management":{cutoff:165,agg:48,competition:"Low"},
      "Quantity Surveying":{cutoff:165,agg:47,competition:"Low"},
      "Law":{cutoff:200,agg:57,competition:"High"},
      "Accounting":{cutoff:185,agg:54,competition:"Medium"},
      "Economics":{cutoff:175,agg:51,competition:"Low"},
      "Business Administration":{cutoff:175,agg:51,competition:"Low"},
      "Banking & Finance":{cutoff:175,agg:51,competition:"Low"},
      "Marketing":{cutoff:165,agg:48,competition:"Low"},
      "Mass Communication":{cutoff:170,agg:50,competition:"Low"},
      "International Relations":{cutoff:170,agg:50,competition:"Low"},
      "Biochemistry":{cutoff:175,agg:51,competition:"Low"},
      "Microbiology":{cutoff:165,agg:48,competition:"Low"},
      "Mathematics":{cutoff:160,agg:46,competition:"Low"},
      "Physics":{cutoff:155,agg:45,competition:"Low"},
      "Chemistry":{cutoff:155,agg:45,competition:"Low"},
      "English Language":{cutoff:150,agg:43,competition:"Low"},
      "Political Science":{cutoff:155,agg:44,competition:"Low"},
      "Sociology":{cutoff:150,agg:43,competition:"Low"},
      "Psychology":{cutoff:155,agg:44,competition:"Low"},
    }
  },
};

const COMPETITION_COLOR={"Very High":"#e17055","High":"#fdcb6e","Medium":"#0984e3","Low":"#00b894"};
const COMPETITION_ADVICE={"Very High":"Extremely competitive. You need a very high Post-UTME score.","High":"Competitive. A strong Post-UTME performance is essential.","Medium":"Moderately competitive. Solid preparation should be enough.","Low":"Less competitive. Good JAMB + reasonable Post-UTME should work."};

function calc(uni,course,jamb,post){
  const cd=uni.courses[course];if(!cd)return null;
  const agg=uni.formula(jamb,post);
  const meetsJamb=jamb>=uni.jamb_cutoff,meetsCourse=jamb>=cd.cutoff,meetsAgg=agg>=cd.agg;
  const neededPost=Math.ceil(Math.max(0,Math.min(100,(cd.agg-jamb/8)*2)));
  let chance,chanceColor,chanceNum;
  if(!meetsJamb){chance="Not Eligible";chanceColor="#b2bec3";chanceNum=0;}
  else if(!meetsCourse){chance="Very Low";chanceColor="#e17055";chanceNum=10;}
  else if(meetsAgg&&agg>=cd.agg+5){chance="High";chanceColor="#00b894";chanceNum=80;}
  else if(meetsAgg){chance="Good";chanceColor="#0984e3";chanceNum=65;}
  else if(agg>=cd.agg-5){chance="Moderate";chanceColor="#fdcb6e";chanceNum=40;}
  else{chance="Low";chanceColor="#e17055";chanceNum=20;}
  return{aggregate:parseFloat(agg.toFixed(2)),max_aggregate:uni.max_aggregate,meets_jamb:meetsJamb,meets_course_cut:meetsCourse,meets_aggregate:meetsAgg,needed_post_score:neededPost,course_cutoff:cd.cutoff,aggregate_cutoff:cd.agg,competition:cd.competition,chance,chanceColor,chanceNum};
}

export default function AdmissionChecker(){
  const nav=useNavigate();
  const { student } = useAuth();
  const[jambScore,setJambScore]=useState("");
  const[postScore,setPostScore]=useState("");
  const[university,setUniversity]=useState("");
  const[course,setCourse]=useState("");
  const[result,setResult]=useState(null);
  const[allResults,setAllResults]=useState([]);
  const[compareMode,setCompareMode]=useState(false);


  const uniKeys=Object.keys(UNIVERSITIES);
  const selectedU=UNIVERSITIES[university];
  const uniCourses=selectedU?Object.keys(selectedU.courses).sort():[];

  const handleCheck=()=>{
    if(!jambScore||!postScore||!university||!course)return alert("Please fill in all fields.");
    const res=calc(UNIVERSITIES[university],course,parseInt(jambScore),parseInt(postScore));
    setResult({...res,uni:UNIVERSITIES[university],course,jambScore:parseInt(jambScore),postScore:parseInt(postScore)});
    setAllResults([]);setCompareMode(false);
  };

  const handleCompareAll=()=>{
    if(!jambScore||!postScore||!course)return alert("Enter JAMB score, Post-UTME score, and a course.");
    const jamb=parseInt(jambScore),post=parseInt(postScore);
    const results=[];
    uniKeys.forEach(key=>{
      const uni=UNIVERSITIES[key];
      if(uni.courses[course]){const res=calc(uni,course,jamb,post);if(res)results.push({...res,uni,key,course});}
    });
    results.sort((a,b)=>b.chanceNum-a.chanceNum);
    setAllResults(results);setResult(null);setCompareMode(true);
  };

  return(
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={()=>nav("/dashboard")}>← Dashboard</button>
        <h2 style={s.title}>🎓 Admission Checker</h2>
        <p style={s.sub}>Check your chances for any Nigerian university — 10 universities, 70+ departments</p>

        <div style={s.formCard}>
          <div style={s.formGrid}>
            <div>
              <label style={s.label}>Your JAMB Score (out of 400)</label>
              <input style={s.input} type="number" min="0" max="400" placeholder="e.g. 280" value={jambScore} onChange={e=>{setJambScore(e.target.value);setResult(null);}}/>
            </div>
            <div>
              <label style={s.label}>Expected Post-UTME Score (%)</label>
              <input style={s.input} type="number" min="0" max="100" placeholder="e.g. 70" value={postScore} onChange={e=>{setPostScore(e.target.value);setResult(null);}}/>
            </div>
          </div>
          <div style={s.formGrid}>
            <div>
              <label style={s.label}>Target University</label>
              <select style={s.input} value={university} onChange={e=>{setUniversity(e.target.value);setCourse("");setResult(null);}}>
                <option value="">Select university</option>
                {uniKeys.map(k=><option key={k} value={k}>{UNIVERSITIES[k].name} ({UNIVERSITIES[k].short})</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Course / Department ({university?uniCourses.length:ALL_COURSES.length} available)</label>
              <select style={s.input} value={course} onChange={e=>{setCourse(e.target.value);setResult(null);}}>
                <option value="">Select course</option>
                {(university?uniCourses:ALL_COURSES).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button style={s.checkBtn} onClick={handleCheck}>Check My Chances →</button>
            {course&&<button style={s.compareBtn} onClick={handleCompareAll}>📊 Compare All Universities</button>}
          </div>
        </div>

        {result&&(
          <div style={s.resultCard}>
            <div style={s.resultHeader}>
              <div>
                <div style={{fontWeight:800,fontSize:18}}>{result.uni.name}</div>
                <div style={{color:"#636e72",fontSize:14}}>{result.course} · {result.uni.type} · {result.uni.location}</div>
              </div>
              <div style={{...s.chancePill,background:result.chanceColor}}>{result.chance}</div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#636e72",marginBottom:4}}><span>Admission Probability</span><span>{result.chanceNum}%</span></div>
              <div style={s.barBg}><div style={{...s.barFill,width:`${result.chanceNum}%`,background:result.chanceColor}}/></div>
            </div>
            <div style={s.statsGrid}>
              <RStat label="Your JAMB" value={result.jambScore} sub="/400" ok={result.meets_course_cut}/>
              <RStat label="Post-UTME" value={`${result.postScore}%`} sub="expected" ok={result.meets_aggregate}/>
              <RStat label="Aggregate" value={result.aggregate} sub={`/${result.max_aggregate}`} ok={result.meets_aggregate}/>
              <RStat label="Required" value={result.aggregate_cutoff} sub={`/${result.max_aggregate}`} neutral/>
            </div>
            <div style={s.checkList}>
              <CI ok={result.meets_jamb} text={`JAMB minimum: ${result.jambScore} ${result.meets_jamb?"≥":"<"} ${result.uni.jamb_cutoff}`}/>
              <CI ok={result.meets_course_cut} text={`Course cutoff: ${result.jambScore} ${result.meets_course_cut?"≥":"<"} ${result.course_cutoff} for ${result.course}`}/>
              <CI ok={result.meets_aggregate} text={`Aggregate: ${result.aggregate} ${result.meets_aggregate?"≥":"<"} ${result.aggregate_cutoff} required`}/>
            </div>
            <div style={{...s.compBox,borderColor:COMPETITION_COLOR[result.competition]}}>
              <span style={{fontWeight:700,color:COMPETITION_COLOR[result.competition]}}>{result.competition} Competition</span>
              <p style={{fontSize:13,color:"#636e72",margin:"4px 0 0"}}>{COMPETITION_ADVICE[result.competition]}</p>
            </div>
            {!result.meets_aggregate&&result.needed_post_score<=100&&(
              <div style={s.needBox}>
                <div style={{fontWeight:800,fontSize:15,color:"#6c63ff"}}>📌 You need {result.needed_post_score}% in Post-UTME</div>
                <p style={{fontSize:13,color:"#636e72",margin:"4px 0 8px"}}>With JAMB {result.jambScore}, scoring {result.needed_post_score}% in Post-UTME meets the aggregate cutoff.</p>
                <button style={s.practiceBtn} onClick={()=>nav("/exam-select?type=POST-UTME")}>Practice Post-UTME →</button>
              </div>
            )}
            {result.needed_post_score>100&&(
              <div style={{...s.needBox,background:"#ffeae9",borderColor:"#e17055"}}>
                <div style={{fontWeight:800,fontSize:15,color:"#e17055"}}>⚠️ JAMB score too low</div>
                <p style={{fontSize:13,color:"#636e72",margin:"4px 0 8px"}}>Even with 100% Post-UTME your aggregate won't reach {result.aggregate_cutoff}. Need JAMB ≥ {result.course_cutoff}.</p>
                <button style={s.compareBtn} onClick={handleCompareAll}>Find Universities That Accept You →</button>
              </div>
            )}
            {result.meets_aggregate&&(
              <div style={{...s.needBox,background:"#e8f8f5",borderColor:"#00b894"}}>
                <div style={{fontWeight:800,fontSize:15,color:"#00b894"}}>✅ You meet the requirements!</div>
                <p style={{fontSize:13,color:"#636e72",margin:"4px 0 8px"}}>{result.competition} competition — keep practising!</p>
                <button style={s.practiceBtn} onClick={()=>nav("/exam-select?type=POST-UTME")}>Keep Practising →</button>
              </div>
            )}
            <div style={s.uniInfo}>
              <span>📝 {result.uni.post_utme_questions} questions</span>
              <span>⏱ {result.uni.post_utme_time} mins</span>
              <span>📍 {result.uni.location}</span>
              <span>🏛 {result.uni.type}</span>
            </div>
          </div>
        )}

        {compareMode&&(
          <div style={s.compareCard}>
            <h3 style={{fontSize:16,fontWeight:800,marginBottom:8}}>📊 {course} — All Universities</h3>
            <p style={{color:"#636e72",fontSize:13,marginBottom:14}}>JAMB: {jambScore} · Post-UTME: {postScore}% · Sorted best to worst</p>
            {allResults.length===0&&<p style={{color:"#636e72",padding:20,textAlign:"center"}}>No universities found for {course}. Try a different course.</p>}
            {allResults.map((r,i)=>(
              <div key={r.key} style={s.compareRow} onClick={()=>{setUniversity(r.key);setCourse(course);setResult({...r});setCompareMode(false);setAllResults([]);}}>
                <span style={{fontWeight:800,width:28,color:"#636e72",fontSize:13}}>#{i+1}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{r.uni.name}</div>
                  <div style={{fontSize:11,color:"#636e72"}}>{r.uni.type} · {r.uni.location} · Agg: {r.aggregate}/{r.max_aggregate}</div>
                  <div style={s.miniBar}><div style={{...s.miniFill,width:`${r.chanceNum}%`,background:r.chanceColor}}/></div>
                </div>
                <div style={{...s.chancePill,background:r.chanceColor,fontSize:11,padding:"3px 10px"}}>{r.chance}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RStat({label,value,sub,ok,neutral}){
  const color=neutral?"#6c63ff":ok?"#00b894":"#e17055";
  return(<div style={{background:"#f8f9fa",borderRadius:10,padding:"12px 8px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color}}>{value}</div><div style={{fontSize:10,color:"#636e72"}}>{sub}</div><div style={{fontSize:11,color:"#636e72",marginTop:2}}>{label}</div></div>);
}
function CI({ok,text}){
  return(<div style={{display:"flex",gap:8,alignItems:"flex-start",padding:"6px 0",borderBottom:"1px solid #f0f0f0",fontSize:13}}><span style={{color:ok?"#00b894":"#e17055",fontWeight:800,flexShrink:0}}>{ok?"✓":"✗"}</span><span style={{color:"#2d3436"}}>{text}</span></div>);
}

const s={
  page:{minHeight:"100vh",background:"#f8f9fa",fontFamily:"sans-serif",padding:16},
  container:{maxWidth:700,margin:"0 auto"},
  back:{background:"none",border:"none",color:"#6c63ff",fontWeight:700,cursor:"pointer",fontSize:14,marginBottom:8},
  title:{fontSize:24,fontWeight:800,color:"#2d3436",marginBottom:4},
  sub:{color:"#636e72",fontSize:14,marginBottom:20},
  formCard:{background:"#fff",borderRadius:14,padding:"20px 18px",boxShadow:"0 2px 16px rgba(0,0,0,0.07)",marginBottom:16},
  formGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16},
  label:{display:"block",fontSize:12,fontWeight:700,color:"#636e72",marginBottom:6},
  input:{width:"100%",padding:"10px 12px",border:"2px solid #dfe6e9",borderRadius:8,fontSize:14,boxSizing:"border-box"},
  checkBtn:{flex:1,padding:"12px 20px",background:"#6c63ff",color:"#fff",border:"none",borderRadius:10,fontWeight:800,cursor:"pointer",fontSize:14},
  compareBtn:{padding:"12px 20px",background:"#f0edff",color:"#6c63ff",border:"2px solid #6c63ff",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14},
  resultCard:{background:"#fff",borderRadius:14,padding:"20px 18px",boxShadow:"0 2px 16px rgba(0,0,0,0.07)",marginBottom:16},
  resultHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10},
  chancePill:{color:"#fff",fontWeight:800,padding:"6px 14px",borderRadius:20,fontSize:13},
  barBg:{height:10,background:"#f0f0f0",borderRadius:5,overflow:"hidden"},
  barFill:{height:"100%",borderRadius:5,transition:"width 0.5s"},
  statsGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16},
  checkList:{marginBottom:16},
  compBox:{border:"2px solid",borderRadius:10,padding:"12px 14px",marginBottom:12},
  needBox:{background:"#f0edff",border:"2px solid #6c63ff",borderRadius:10,padding:"14px 16px",marginBottom:12},
  practiceBtn:{padding:"9px 16px",background:"#6c63ff",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13},
  uniInfo:{display:"flex",gap:12,flexWrap:"wrap",fontSize:12,color:"#636e72",paddingTop:12,borderTop:"1px solid #f0f0f0",marginTop:12},
  compareCard:{background:"#fff",borderRadius:14,padding:"20px 18px",boxShadow:"0 2px 16px rgba(0,0,0,0.07)"},
  compareRow:{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #f0f0f0",cursor:"pointer"},
  miniBar:{height:4,background:"#f0f0f0",borderRadius:2,overflow:"hidden",marginTop:6},
  miniFill:{height:"100%",borderRadius:2},
};
