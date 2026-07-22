import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useBackNav from "../utils/useBackNav";

// ── WAEC/NECO grade system ────────────────────────────────
const GRADE_POINTS = { A1:9, B2:8, B3:7, C4:6, C5:5, C6:4, D7:3, E8:2, F9:1 };
const GRADES = Object.keys(GRADE_POINTS);

// Subject requirements per course (JAMB subjects + O-level subjects)
const COURSE_INFO = {
  "Medicine & Surgery":      { jamb:["English","Biology","Chemistry","Physics or Mathematics"], olevel:["Biology","Chemistry","Physics","Mathematics","English Language"], minGrade:"B3", note:"Requires at least 5 credits including English, Biology, Chemistry and Physics/Maths." },
  "Dentistry":               { jamb:["English","Biology","Chemistry","Physics or Mathematics"], olevel:["Biology","Chemistry","Physics","Mathematics","English Language"], minGrade:"B3", note:"Same requirements as Medicine — equally competitive." },
  "Pharmacy":                { jamb:["Chemistry","Biology","Physics or Mathematics","English"], olevel:["Chemistry","Biology","Physics","Mathematics","English Language"], minGrade:"C4", note:"Chemistry O-level credit is non-negotiable for all schools." },
  "Nursing":                 { jamb:["Biology","Chemistry","Physics or Mathematics","English"], olevel:["Biology","Chemistry","Physics","Mathematics","English Language"], minGrade:"C4", note:"Some schools also accept Agricultural Science in place of Physics." },
  "Physiotherapy":           { jamb:["Biology","Chemistry","Physics","English"], olevel:["Biology","Chemistry","Physics","Mathematics","English Language"], minGrade:"C4", note:"Physics and Biology credits are both mandatory." },
  "Radiography":             { jamb:["Biology","Chemistry","Physics","English"], olevel:["Biology","Chemistry","Physics","Mathematics","English Language"], minGrade:"C4", note:"Strong Physics background required at all levels." },
  "Medical Laboratory Science":{ jamb:["Biology","Chemistry","Physics or Mathematics","English"], olevel:["Biology","Chemistry","Physics","Mathematics","English Language"], minGrade:"C4", note:"Often referred to as MLS or Medical Laboratory Technology." },
  "Anatomy":                 { jamb:["Biology","Chemistry","Physics or Mathematics","English"], olevel:["Biology","Chemistry","Physics","Mathematics","English Language"], minGrade:"C4", note:"Mainly a foundation for postgraduate medical training." },
  "Physiology":              { jamb:["Biology","Chemistry","Physics or Mathematics","English"], olevel:["Biology","Chemistry","Physics","Mathematics","English Language"], minGrade:"C4", note:"Often combined with Anatomy in early years." },
  "Biochemistry":            { jamb:["Biology","Chemistry","Physics or Mathematics","English"], olevel:["Biology","Chemistry","Mathematics","English Language"], minGrade:"C5", note:"Can serve as foundation for Medicine, Pharmacy, or Biomedical research." },
  "Microbiology":            { jamb:["Biology","Chemistry","Physics or Mathematics","English"], olevel:["Biology","Chemistry","Mathematics","English Language"], minGrade:"C5", note:"Strong biology background is key. Good pathway into health or food science." },
  "Zoology":                 { jamb:["Biology","Chemistry","Physics or Mathematics","English"], olevel:["Biology","Chemistry","Mathematics","English Language"], minGrade:"C6", note:"Less competitive — useful for biology/education careers." },
  "Botany":                  { jamb:["Biology","Chemistry","Physics or Mathematics","English"], olevel:["Biology","Chemistry","Mathematics","English Language"], minGrade:"C6", note:"Often combined with Zoology in a general Biology department." },
  "Chemistry":               { jamb:["Chemistry","Physics","Mathematics","English"], olevel:["Chemistry","Physics","Mathematics","English Language"], minGrade:"C5", note:"Foundation for Petrochemicals, Pharmaceuticals, Food Processing." },
  "Physics":                 { jamb:["Physics","Chemistry","Mathematics","English"], olevel:["Physics","Mathematics","English Language","Chemistry"], minGrade:"C5", note:"Gateway to Engineering, Geophysics, and Electronics careers." },
  "Mathematics":             { jamb:["Mathematics","Physics","Chemistry or Economics","English"], olevel:["Mathematics","Physics","English Language"], minGrade:"C4", note:"Maths A1 is a huge plus. Opens doors to Actuarial Science and Statistics." },
  "Statistics":              { jamb:["Mathematics","Economics or Chemistry","Physics","English"], olevel:["Mathematics","English Language"], minGrade:"C4", note:"Very useful for Data Science and Banking careers." },
  "Computer Science":        { jamb:["Mathematics","Physics","Chemistry or Economics","English"], olevel:["Mathematics","Physics","English Language"], minGrade:"C5", note:"Strong maths is critical. Maths and Physics credits are both expected." },
  "Information Technology":  { jamb:["Mathematics","Physics","Chemistry or Economics","English"], olevel:["Mathematics","Physics","English Language"], minGrade:"C5", note:"Similar to Computer Science but with more systems and networking focus." },
  "Computer Engineering":    { jamb:["Mathematics","Physics","Chemistry","English"], olevel:["Mathematics","Physics","Chemistry","English Language"], minGrade:"C4", note:"All three science subjects required. One of the most competitive Engineering courses." },
  "Civil Engineering":       { jamb:["Mathematics","Physics","Chemistry","English"], olevel:["Mathematics","Physics","Chemistry","English Language"], minGrade:"C4", note:"Bridges, buildings, infrastructure — requires strong Physics and Maths." },
  "Electrical Engineering":  { jamb:["Mathematics","Physics","Chemistry","English"], olevel:["Mathematics","Physics","Chemistry","English Language"], minGrade:"C4", note:"Physics and Maths A1 strongly preferred by top schools." },
  "Mechanical Engineering":  { jamb:["Mathematics","Physics","Chemistry","English"], olevel:["Mathematics","Physics","Chemistry","English Language"], minGrade:"C4", note:"Focus on machines, thermodynamics, materials. Strong physics base needed." },
  "Chemical Engineering":    { jamb:["Mathematics","Chemistry","Physics","English"], olevel:["Mathematics","Chemistry","Physics","English Language"], minGrade:"C4", note:"Bridges Chemistry and Engineering. Good for Oil & Gas, Pharmaceuticals." },
  "Petroleum Engineering":   { jamb:["Mathematics","Chemistry","Physics","English"], olevel:["Mathematics","Chemistry","Physics","English Language"], minGrade:"C4", note:"Highest-earning Engineering in Nigeria. Very competitive, especially in UNIPORT." },
  "Marine Engineering":      { jamb:["Mathematics","Physics","Chemistry","English"], olevel:["Mathematics","Physics","Chemistry","English Language"], minGrade:"C4", note:"Covers design and operation of ships and marine structures." },
  "Agricultural Engineering":{ jamb:["Mathematics","Physics","Chemistry or Biology","English"], olevel:["Mathematics","Physics","Biology or Chemistry","English Language"], minGrade:"C5", note:"Less competitive than core Engineering. Good pathway into agribusiness." },
  "Biomedical Engineering":  { jamb:["Mathematics","Physics","Biology or Chemistry","English"], olevel:["Mathematics","Physics","Biology","Chemistry","English Language"], minGrade:"C4", note:"Combines Medical and Engineering. Growing field in Nigeria." },
  "Architecture":            { jamb:["Mathematics","Physics","Chemistry or Fine Art","English"], olevel:["Mathematics","Physics","English Language","Fine Art or Technical Drawing"], minGrade:"C5", note:"Drawing ability and creativity matter alongside academic scores." },
  "Building Technology":     { jamb:["Mathematics","Physics","Chemistry","English"], olevel:["Mathematics","Physics","English Language"], minGrade:"C5", note:"Practical construction-focused course. High demand from construction firms." },
  "Quantity Surveying":      { jamb:["Mathematics","Physics","Economics or Geography","English"], olevel:["Mathematics","Physics","English Language"], minGrade:"C5", note:"Manages building project costs. Less competitive than Architecture." },
  "Urban & Regional Planning":{ jamb:["Mathematics","Geography","Economics or Government","English"], olevel:["Mathematics","Geography","English Language"], minGrade:"C5", note:"Town planning, zoning, policy. Good for government and consultancy work." },
  "Estate Management":       { jamb:["Mathematics","Economics","Geography or Government","English"], olevel:["Mathematics","Economics","English Language"], minGrade:"C5", note:"Real estate and property valuation. Good career in urban Nigeria." },
  "Surveying & Geoinformatics":{ jamb:["Mathematics","Physics","Geography","English"], olevel:["Mathematics","Physics","Geography","English Language"], minGrade:"C5", note:"Uses GPS and GIS tech. Growing demand in land use and infrastructure." },
  "Geology":                 { jamb:["Chemistry","Physics","Mathematics","English"], olevel:["Chemistry","Physics","Mathematics","English Language"], minGrade:"C5", note:"Critical for mining and oil exploration. Pairs well with Petroleum Engineering." },
  "Geophysics":              { jamb:["Physics","Mathematics","Chemistry","English"], olevel:["Physics","Mathematics","Chemistry","English Language"], minGrade:"C5", note:"Applied in earthquake detection and oil/gas prospecting." },
  "Agriculture":             { jamb:["Biology","Chemistry","Physics or Agriculture","English"], olevel:["Biology","Chemistry","English Language","Mathematics"], minGrade:"C6", note:"Growing sector. Nigeria is investing heavily in agriculture." },
  "Animal Science":          { jamb:["Biology","Chemistry","Physics or Agriculture","English"], olevel:["Biology","Chemistry","English Language"], minGrade:"C6", note:"Livestock production, veterinary-adjacent. Good for agribusiness." },
  "Fisheries & Aquaculture": { jamb:["Biology","Chemistry","Physics or Agriculture","English"], olevel:["Biology","Chemistry","English Language"], minGrade:"C6", note:"Emerging sector. Especially relevant in Rivers, Delta, and Cross River States." },
  "Forestry & Wildlife":     { jamb:["Biology","Chemistry","Physics or Agriculture","English"], olevel:["Biology","Chemistry","English Language"], minGrade:"C6", note:"Wildlife conservation and forest management." },
  "Food Science & Technology":{ jamb:["Chemistry","Biology","Physics or Mathematics","English"], olevel:["Chemistry","Biology","Mathematics","English Language"], minGrade:"C5", note:"Growing demand in FMCG and food processing industries." },
  "Soil Science":            { jamb:["Chemistry","Biology","Physics or Agriculture","English"], olevel:["Chemistry","Biology","English Language"], minGrade:"C6", note:"Foundation for sustainable farming and environmental science." },
  "Accounting":              { jamb:["Mathematics","Economics","Commerce or Government","English"], olevel:["Mathematics","Economics","English Language","Commerce or Accounting"], minGrade:"C5", note:"Very popular. Maths credit is non-negotiable for all schools." },
  "Banking & Finance":       { jamb:["Mathematics","Economics","Commerce or Government","English"], olevel:["Mathematics","Economics","English Language"], minGrade:"C5", note:"Closely related to Accounting. Leads into commercial banking, fintech." },
  "Business Administration": { jamb:["Mathematics","Economics","Commerce or Government","English"], olevel:["Mathematics","English Language","Commerce or Economics"], minGrade:"C5", note:"Broad business degree. Best paired with internships and tech skills." },
  "Economics":               { jamb:["Mathematics","Economics","Government or Geography","English"], olevel:["Mathematics","Economics","English Language"], minGrade:"C5", note:"Strong analytical and policy career paths. JAMB Maths required." },
  "Marketing":               { jamb:["Mathematics","Economics","Commerce","English"], olevel:["Mathematics","Economics","English Language"], minGrade:"C5", note:"Practical and versatile. Strong demand in digital marketing in Nigeria." },
  "Insurance":               { jamb:["Mathematics","Economics","Commerce or Government","English"], olevel:["Mathematics","Economics","English Language"], minGrade:"C5", note:"Underrated but stable career in Nigerian financial services sector." },
  "Actuarial Science":       { jamb:["Mathematics","Economics","Statistics or Physics","English"], olevel:["Mathematics","Economics","English Language","Physics or Statistics"], minGrade:"C4", note:"One of the most mathematically demanding degrees. High earning potential." },
  "Public Administration":   { jamb:["Government","Economics","CRS or History","English"], olevel:["Government","Economics","English Language"], minGrade:"C5", note:"Prepares for civil service, policy, and government roles." },
  "Political Science":       { jamb:["Government","Economics","CRS or History","English"], olevel:["Government","Economics","English Language"], minGrade:"C5", note:"Good for law school, diplomacy, journalism, or politics." },
  "Sociology":               { jamb:["Government","Economics","CRS or History","English"], olevel:["English Language","Economics or Government"], minGrade:"C5", note:"Broad social science. Good for NGOs, research, social work careers." },
  "Psychology":              { jamb:["Biology or Government","Economics or Chemistry","CRS","English"], olevel:["Biology or Economics","English Language"], minGrade:"C5", note:"Competitive in private schools. Leads to counselling, HR, mental health." },
  "Social Work":             { jamb:["Government","Economics","Sociology or CRS","English"], olevel:["English Language","Government or Economics"], minGrade:"C5", note:"Focused on community support and welfare. Many NGO roles." },
  "International Relations": { jamb:["Government","Economics","History or CRS","English"], olevel:["Government","Economics","English Language"], minGrade:"C5", note:"Good for diplomacy, foreign affairs, international NGOs." },
  "Mass Communication":      { jamb:["Literature in English or Government","Economics or CRS","English"], olevel:["English Language","Literature in English or Government"], minGrade:"C5", note:"Journalism, PR, broadcasting. Maths not required." },
  "Journalism":              { jamb:["Literature in English","Government","Economics","English"], olevel:["English Language","Literature in English"], minGrade:"C5", note:"Similar to Mass Communication with a stronger writing focus." },
  "Law":                     { jamb:["Literature in English","Government","Any Social Science","English"], olevel:["Literature in English","Government","English Language","Mathematics"], minGrade:"B3", note:"Law is one of the most competitive arts courses. Literature credit is mandatory." },
  "English Language":        { jamb:["Literature in English","Government or History","CRS","English"], olevel:["Literature in English","English Language"], minGrade:"C5", note:"Maths not required. Opens paths into teaching, writing, and linguistics." },
  "History & International Studies":{ jamb:["History","Government","CRS or Economics","English"], olevel:["History","Government","English Language"], minGrade:"C5", note:"Combines diplomacy, politics, and historical analysis." },
  "Philosophy":              { jamb:["Literature in English","Government or CRS","Economics","English"], olevel:["English Language","Literature in English or Government"], minGrade:"C5", note:"Excellent preparation for Law, Theology, or academic careers." },
  "Religious Studies":       { jamb:["CRS or IRS","Literature in English or Government","English"], olevel:["CRS or IRS","English Language"], minGrade:"C5", note:"Maths not required. Often leads into theology or counselling." },
  "Theatre Arts":            { jamb:["Literature in English","Government or CRS","Fine Art","English"], olevel:["Literature in English","English Language"], minGrade:"C5", note:"Talent screening (audition) often required alongside JAMB and Post-UTME." },
  "Music":                   { jamb:["Music or Literature in English","Government","English"], olevel:["Music","English Language"], minGrade:"C5", note:"Practical music audition usually required. JAMB Maths not required." },
  "Fine & Applied Arts":     { jamb:["Fine Art","Literature in English or Government","English"], olevel:["Fine Art","English Language"], minGrade:"C5", note:"Portfolio may be required. Creative career in design, animation, advertising." },
  "French":                  { jamb:["French","Literature in English or Government","English"], olevel:["French","English Language"], minGrade:"C5", note:"Fluency valued. Opens doors in ECOWAS, diplomacy, and oil companies." },
  "Linguistics":             { jamb:["Literature in English","Government or CRS","English"], olevel:["Literature in English","English Language"], minGrade:"C5", note:"Study of language structure. Good for AI/NLP, interpreting, teaching." },
  "Library & Information Science":{ jamb:["Government or Literature","Economics or CRS","English"], olevel:["English Language","Any 2 Social Science subjects"], minGrade:"C5", note:"Information management career. Growing role in digital libraries and archives." },
  "Education & English":     { jamb:["Literature in English","Government or CRS","English"], olevel:["Literature in English","English Language"], minGrade:"C5", note:"B.Ed degree. Teaching career focused on English Language and Literature." },
  "Education & Mathematics": { jamb:["Mathematics","Physics or Economics","Chemistry","English"], olevel:["Mathematics","English Language"], minGrade:"C5", note:"B.Ed in Mathematics education. High demand in secondary schools." },
  "Education & Biology":     { jamb:["Biology","Chemistry","Physics or Mathematics","English"], olevel:["Biology","Chemistry","English Language","Mathematics"], minGrade:"C5", note:"B.Ed in Biology education. Good demand in rural areas." },
  "Education & Chemistry":   { jamb:["Chemistry","Physics","Mathematics","English"], olevel:["Chemistry","Physics","Mathematics","English Language"], minGrade:"C5", note:"B.Ed in Chemistry education. Combines subject expertise with pedagogy." },
  "Education & Physics":     { jamb:["Physics","Mathematics","Chemistry","English"], olevel:["Physics","Mathematics","English Language"], minGrade:"C5", note:"B.Ed in Physics education. Very high demand — severe shortage of Physics teachers." },
  "Education & Economics":   { jamb:["Economics","Mathematics","Government or Commerce","English"], olevel:["Economics","Mathematics","English Language"], minGrade:"C5", note:"B.Ed in Economics education." },
  "Physical & Health Education":{ jamb:["Biology","Chemistry or Physics","Mathematics","English"], olevel:["Biology","English Language","Mathematics"], minGrade:"C5", note:"Sports science and physical education teaching. Athletics aptitude helps." },
};

const ALL_COURSES = Object.keys(COURSE_INFO).sort();

const UNIVERSITIES = {
  UNILAG:  { name:"University of Lagos",         short:"UNILAG",   type:"Federal", location:"Lagos",   jamb_cutoff:200, formula:(j,p)=>(j/8)+(p/2), max_aggregate:85,  courses:{"Medicine & Surgery":{cutoff:280,agg:75},"Dentistry":{cutoff:275,agg:74},"Pharmacy":{cutoff:260,agg:70},"Physiotherapy":{cutoff:250,agg:68},"Radiography":{cutoff:240,agg:65},"Nursing":{cutoff:240,agg:64},"Medical Laboratory Science":{cutoff:230,agg:63},"Anatomy":{cutoff:240,agg:65},"Physiology":{cutoff:235,agg:64},"Biochemistry":{cutoff:220,agg:60},"Microbiology":{cutoff:215,agg:58},"Computer Science":{cutoff:230,agg:63},"Computer Engineering":{cutoff:240,agg:65},"Civil Engineering":{cutoff:240,agg:65},"Electrical Engineering":{cutoff:240,agg:65},"Mechanical Engineering":{cutoff:235,agg:64},"Chemical Engineering":{cutoff:235,agg:63},"Petroleum Engineering":{cutoff:245,agg:66},"Architecture":{cutoff:220,agg:60},"Law":{cutoff:270,agg:72},"Accounting":{cutoff:220,agg:62},"Economics":{cutoff:210,agg:58},"Mathematics":{cutoff:200,agg:53},"Physics":{cutoff:200,agg:52},"Chemistry":{cutoff:200,agg:54},"Mass Communication":{cutoff:200,agg:55},"Political Science":{cutoff:200,agg:52},"Sociology":{cutoff:200,agg:51},"English Language":{cutoff:200,agg:50},"History & International Studies":{cutoff:200,agg:49},"Business Administration":{cutoff:210,agg:58},"Banking & Finance":{cutoff:210,agg:59},"Marketing":{cutoff:200,agg:55},"Information Technology":{cutoff:220,agg:60},"Estate Management":{cutoff:200,agg:54},"Building Technology":{cutoff:200,agg:54},"Agriculture":{cutoff:200,agg:48},"Food Science & Technology":{cutoff:200,agg:50},"Education & Mathematics":{cutoff:200,agg:49},"Education & English":{cutoff:200,agg:48}} },
  UI:      { name:"University of Ibadan",         short:"UI",       type:"Federal", location:"Oyo",     jamb_cutoff:200, formula:(j,p)=>(j/8)+(p/2), max_aggregate:90,  courses:{"Medicine & Surgery":{cutoff:270,agg:74},"Dentistry":{cutoff:265,agg:72},"Pharmacy":{cutoff:255,agg:70},"Physiotherapy":{cutoff:245,agg:67},"Nursing":{cutoff:235,agg:64},"Medical Laboratory Science":{cutoff:225,agg:62},"Anatomy":{cutoff:240,agg:65},"Physiology":{cutoff:235,agg:64},"Biochemistry":{cutoff:220,agg:61},"Microbiology":{cutoff:210,agg:58},"Computer Science":{cutoff:220,agg:61},"Civil Engineering":{cutoff:230,agg:63},"Electrical Engineering":{cutoff:228,agg:63},"Mechanical Engineering":{cutoff:225,agg:62},"Chemical Engineering":{cutoff:225,agg:62},"Computer Engineering":{cutoff:228,agg:63},"Architecture":{cutoff:210,agg:57},"Law":{cutoff:260,agg:71},"Accounting":{cutoff:215,agg:60},"Economics":{cutoff:210,agg:57},"Business Administration":{cutoff:210,agg:56},"Political Science":{cutoff:200,agg:53},"Sociology":{cutoff:200,agg:51},"Mass Communication":{cutoff:200,agg:53},"English Language":{cutoff:200,agg:49},"Mathematics":{cutoff:200,agg:54},"Physics":{cutoff:200,agg:53},"Chemistry":{cutoff:200,agg:54},"Geology":{cutoff:200,agg:52},"Agriculture":{cutoff:200,agg:50},"Animal Science":{cutoff:200,agg:49},"Food Science & Technology":{cutoff:200,agg:51},"Fisheries & Aquaculture":{cutoff:200,agg:48},"Education & Mathematics":{cutoff:200,agg:48},"Education & English":{cutoff:200,agg:48}} },
  OAU:     { name:"Obafemi Awolowo University",   short:"OAU",      type:"Federal", location:"Osun",    jamb_cutoff:200, formula:(j,p)=>(j/8)+(p/2), max_aggregate:90,  courses:{"Medicine & Surgery":{cutoff:270,agg:74},"Dentistry":{cutoff:265,agg:72},"Pharmacy":{cutoff:255,agg:70},"Physiotherapy":{cutoff:240,agg:66},"Medical Laboratory Science":{cutoff:225,agg:62},"Anatomy":{cutoff:238,agg:65},"Biochemistry":{cutoff:220,agg:62},"Microbiology":{cutoff:210,agg:58},"Computer Science":{cutoff:220,agg:61},"Computer Engineering":{cutoff:225,agg:62},"Civil Engineering":{cutoff:230,agg:63},"Electrical Engineering":{cutoff:228,agg:62},"Mechanical Engineering":{cutoff:225,agg:62},"Chemical Engineering":{cutoff:225,agg:62},"Agricultural Engineering":{cutoff:200,agg:54},"Architecture":{cutoff:240,agg:65},"Law":{cutoff:260,agg:71},"Accounting":{cutoff:215,agg:60},"Economics":{cutoff:210,agg:57},"Business Administration":{cutoff:205,agg:56},"International Relations":{cutoff:205,agg:55},"Political Science":{cutoff:200,agg:53},"Sociology":{cutoff:200,agg:51},"Mass Communication":{cutoff:200,agg:53},"English Language":{cutoff:200,agg:49},"Agriculture":{cutoff:200,agg:49},"Food Science & Technology":{cutoff:200,agg:51}} },
  UNIBEN:  { name:"University of Benin",          short:"UNIBEN",   type:"Federal", location:"Edo",     jamb_cutoff:180, formula:(j,p)=>(j/8)+(p/2), max_aggregate:100, courses:{"Medicine & Surgery":{cutoff:260,agg:70},"Dentistry":{cutoff:250,agg:68},"Pharmacy":{cutoff:245,agg:66},"Nursing":{cutoff:230,agg:63},"Medical Laboratory Science":{cutoff:220,agg:60},"Physiotherapy":{cutoff:230,agg:63},"Anatomy":{cutoff:235,agg:64},"Biochemistry":{cutoff:200,agg:56},"Microbiology":{cutoff:195,agg:54},"Computer Science":{cutoff:200,agg:56},"Computer Engineering":{cutoff:210,agg:58},"Civil Engineering":{cutoff:220,agg:60},"Electrical Engineering":{cutoff:215,agg:59},"Mechanical Engineering":{cutoff:210,agg:58},"Chemical Engineering":{cutoff:210,agg:58},"Petroleum Engineering":{cutoff:220,agg:60},"Agricultural Engineering":{cutoff:185,agg:52},"Architecture":{cutoff:200,agg:56},"Geology":{cutoff:180,agg:50},"Geophysics":{cutoff:180,agg:50},"Law":{cutoff:250,agg:68},"Accounting":{cutoff:200,agg:57},"Banking & Finance":{cutoff:185,agg:52},"Economics":{cutoff:190,agg:54},"Business Administration":{cutoff:190,agg:53},"Mass Communication":{cutoff:180,agg:51},"English Language":{cutoff:180,agg:48},"Political Science":{cutoff:180,agg:50},"Sociology":{cutoff:180,agg:49}} },
  ABU:     { name:"Ahmadu Bello University",      short:"ABU",      type:"Federal", location:"Kaduna",  jamb_cutoff:180, formula:(j,p)=>(j/8)+(p/2), max_aggregate:90,  courses:{"Medicine & Surgery":{cutoff:250,agg:68},"Pharmacy":{cutoff:240,agg:65},"Dentistry":{cutoff:245,agg:66},"Nursing":{cutoff:225,agg:62},"Medical Laboratory Science":{cutoff:215,agg:59},"Biochemistry":{cutoff:200,agg:55},"Microbiology":{cutoff:190,agg:53},"Computer Science":{cutoff:200,agg:55},"Computer Engineering":{cutoff:210,agg:57},"Civil Engineering":{cutoff:220,agg:60},"Electrical Engineering":{cutoff:215,agg:59},"Mechanical Engineering":{cutoff:210,agg:58},"Chemical Engineering":{cutoff:210,agg:58},"Agricultural Engineering":{cutoff:190,agg:53},"Architecture":{cutoff:200,agg:55},"Law":{cutoff:240,agg:65},"Accounting":{cutoff:200,agg:56},"Economics":{cutoff:190,agg:53},"Business Administration":{cutoff:185,agg:52},"English Language":{cutoff:180,agg:47},"Agriculture":{cutoff:180,agg:48}} },
  UNN:     { name:"University of Nigeria, Nsukka",short:"UNN",      type:"Federal", location:"Enugu",   jamb_cutoff:180, formula:(j,p)=>(j/8)+(p/2), max_aggregate:90,  courses:{"Medicine & Surgery":{cutoff:260,agg:72},"Pharmacy":{cutoff:240,agg:66},"Dentistry":{cutoff:245,agg:67},"Nursing":{cutoff:225,agg:62},"Medical Laboratory Science":{cutoff:215,agg:59},"Biochemistry":{cutoff:200,agg:55},"Microbiology":{cutoff:190,agg:53},"Computer Science":{cutoff:200,agg:55},"Computer Engineering":{cutoff:210,agg:58},"Civil Engineering":{cutoff:215,agg:59},"Electrical Engineering":{cutoff:210,agg:58},"Mechanical Engineering":{cutoff:208,agg:57},"Chemical Engineering":{cutoff:205,agg:57},"Architecture":{cutoff:200,agg:55},"Law":{cutoff:240,agg:66},"Accounting":{cutoff:200,agg:56},"Economics":{cutoff:190,agg:53},"Business Administration":{cutoff:190,agg:52},"Marketing":{cutoff:185,agg:51},"Mass Communication":{cutoff:185,agg:51},"English Language":{cutoff:180,agg:47},"Geology":{cutoff:180,agg:49},"Agriculture":{cutoff:180,agg:47}} },
  UNIPORT: { name:"University of Port Harcourt",  short:"UNIPORT",  type:"Federal", location:"Rivers",  jamb_cutoff:180, formula:(j,p)=>(j/8)+(p/2), max_aggregate:90,  courses:{"Medicine & Surgery":{cutoff:250,agg:68},"Pharmacy":{cutoff:235,agg:64},"Nursing":{cutoff:225,agg:62},"Medical Laboratory Science":{cutoff:215,agg:59},"Biochemistry":{cutoff:190,agg:53},"Microbiology":{cutoff:185,agg:52},"Computer Science":{cutoff:190,agg:53},"Computer Engineering":{cutoff:200,agg:55},"Civil Engineering":{cutoff:215,agg:59},"Electrical Engineering":{cutoff:210,agg:58},"Mechanical Engineering":{cutoff:210,agg:58},"Chemical Engineering":{cutoff:210,agg:58},"Petroleum Engineering":{cutoff:240,agg:65},"Marine Engineering":{cutoff:210,agg:58},"Architecture":{cutoff:195,agg:53},"Geology":{cutoff:180,agg:50},"Geophysics":{cutoff:180,agg:50},"Law":{cutoff:230,agg:63},"Accounting":{cutoff:185,agg:52},"Economics":{cutoff:180,agg:50},"Business Administration":{cutoff:180,agg:50},"Mass Communication":{cutoff:180,agg:50},"English Language":{cutoff:180,agg:46},"Agriculture":{cutoff:180,agg:46},"Fisheries & Aquaculture":{cutoff:180,agg:46},"Education & Mathematics":{cutoff:180,agg:46}} },
  UNILORIN:{ name:"University of Ilorin",         short:"UNILORIN", type:"Federal", location:"Kwara",   jamb_cutoff:180, formula:(j,p)=>(j/8)+(p/2), max_aggregate:90,  courses:{"Medicine & Surgery":{cutoff:260,agg:70},"Pharmacy":{cutoff:240,agg:65},"Nursing":{cutoff:225,agg:61},"Medical Laboratory Science":{cutoff:215,agg:58},"Biochemistry":{cutoff:195,agg:54},"Microbiology":{cutoff:185,agg:52},"Computer Science":{cutoff:190,agg:53},"Civil Engineering":{cutoff:210,agg:57},"Electrical Engineering":{cutoff:205,agg:56},"Mechanical Engineering":{cutoff:205,agg:56},"Chemical Engineering":{cutoff:200,agg:55},"Computer Engineering":{cutoff:205,agg:56},"Law":{cutoff:245,agg:66},"Accounting":{cutoff:200,agg:56},"Economics":{cutoff:190,agg:53},"Business Administration":{cutoff:185,agg:52},"Mass Communication":{cutoff:180,agg:50},"English Language":{cutoff:180,agg:46},"Agriculture":{cutoff:180,agg:46},"Education & English":{cutoff:180,agg:45},"Education & Mathematics":{cutoff:180,agg:46}} },
  LASU:    { name:"Lagos State University",       short:"LASU",     type:"State",   location:"Lagos",   jamb_cutoff:160, formula:(j,p)=>(j/8)+(p/2), max_aggregate:85,  courses:{"Medicine & Surgery":{cutoff:240,agg:65},"Pharmacy":{cutoff:225,agg:62},"Nursing":{cutoff:210,agg:58},"Law":{cutoff:220,agg:60},"Accounting":{cutoff:200,agg:55},"Banking & Finance":{cutoff:195,agg:54},"Economics":{cutoff:185,agg:52},"Business Administration":{cutoff:180,agg:51},"Mass Communication":{cutoff:175,agg:50},"Civil Engineering":{cutoff:195,agg:53},"Electrical Engineering":{cutoff:190,agg:52},"Mechanical Engineering":{cutoff:188,agg:51},"Computer Science":{cutoff:180,agg:50},"Computer Engineering":{cutoff:185,agg:51},"Architecture":{cutoff:185,agg:52},"Biochemistry":{cutoff:175,agg:50},"Microbiology":{cutoff:170,agg:49},"Mathematics":{cutoff:160,agg:45},"Physics":{cutoff:160,agg:44},"Chemistry":{cutoff:160,agg:45},"English Language":{cutoff:160,agg:44},"Political Science":{cutoff:165,agg:47},"Sociology":{cutoff:160,agg:45},"Education & English":{cutoff:160,agg:43},"Education & Mathematics":{cutoff:160,agg:43}} },
  COVENANT:{ name:"Covenant University",          short:"Covenant", type:"Private", location:"Ogun",    jamb_cutoff:150, formula:(j,p)=>(j/8)+(p/2), max_aggregate:80,  courses:{"Civil Engineering":{cutoff:195,agg:56},"Electrical Engineering":{cutoff:200,agg:58},"Mechanical Engineering":{cutoff:195,agg:56},"Chemical Engineering":{cutoff:190,agg:55},"Computer Engineering":{cutoff:200,agg:58},"Computer Science":{cutoff:190,agg:55},"Information Technology":{cutoff:185,agg:54},"Architecture":{cutoff:185,agg:54},"Law":{cutoff:200,agg:57},"Accounting":{cutoff:185,agg:54},"Economics":{cutoff:175,agg:51},"Business Administration":{cutoff:175,agg:51},"Banking & Finance":{cutoff:175,agg:51},"Mass Communication":{cutoff:170,agg:50},"International Relations":{cutoff:170,agg:50},"Biochemistry":{cutoff:175,agg:51},"Microbiology":{cutoff:165,agg:48},"Mathematics":{cutoff:160,agg:46},"Physics":{cutoff:155,agg:45},"Chemistry":{cutoff:155,agg:45},"English Language":{cutoff:150,agg:43},"Political Science":{cutoff:155,agg:44},"Psychology":{cutoff:155,agg:44}} },
};

const COMPETITION_THRESHOLDS = {
  "Very High": { label:"Very High", color:"#e17055", desc:"Extremely competitive. You need a very high Post-UTME score to stand a chance." },
  "High":      { label:"High",      color:"#fdcb6e", desc:"Competitive. A strong Post-UTME performance is essential to secure admission." },
  "Medium":    { label:"Medium",    color:"#0984e3", desc:"Moderately competitive. Solid preparation should be enough with your score." },
  "Low":       { label:"Low",       color:"#00b894", desc:"Less competitive. A good JAMB score plus a reasonable Post-UTME should work." },
};

function getCompetition(cutoff) {
  if (cutoff >= 260) return "Very High";
  if (cutoff >= 230) return "High";
  if (cutoff >= 200) return "Medium";
  return "Low";
}

function calcOlevelScore(waecGrades, neco, reqSubjects) {
  // Check if mandatory O-level subjects have at least C6 credits
  let passCount = 0;
  for (const subj of reqSubjects) {
    const waecG = waecGrades[subj] || "";
    const necoG = neco[subj] || "";
    const waecP = GRADE_POINTS[waecG] || 0;
    const necoP = GRADE_POINTS[necoG] || 0;
    if (waecP >= GRADE_POINTS["C6"] || necoP >= GRADE_POINTS["C6"]) passCount++;
  }
  return { passCount, required: reqSubjects.length };
}

function calc(uni, course, jamb, post, waecGrades, necoGrades) {
  const cd = uni.courses[course];
  if (!cd) return null;
  const agg = uni.formula(jamb, post);
  const competition = getCompetition(cd.cutoff);
  const meetsJamb = jamb >= uni.jamb_cutoff;
  const meetsCourse = jamb >= cd.cutoff;
  const meetsAgg = agg >= cd.agg;
  const neededPost = Math.ceil(Math.max(0, Math.min(100, (cd.agg - jamb / 8) * 2)));

  // O-level check
  const courseReq = COURSE_INFO[course];
  let olevelResult = null;
  if (courseReq && (Object.keys(waecGrades).length > 0 || Object.keys(necoGrades).length > 0)) {
    olevelResult = calcOlevelScore(waecGrades, necoGrades, courseReq.olevel);
  }

  let chance, chanceColor, chanceNum;
  if (!meetsJamb) { chance = "Not Eligible"; chanceColor = "#b2bec3"; chanceNum = 0; }
  else if (!meetsCourse) { chance = "Very Low"; chanceColor = "#e17055"; chanceNum = 10; }
  else if (meetsAgg && agg >= cd.agg + 5) { chance = "High"; chanceColor = "#00b894"; chanceNum = 80; }
  else if (meetsAgg) { chance = "Good"; chanceColor = "#0984e3"; chanceNum = 65; }
  else if (agg >= cd.agg - 5) { chance = "Moderate"; chanceColor = "#fdcb6e"; chanceNum = 40; }
  else { chance = "Low"; chanceColor = "#e17055"; chanceNum = 20; }

  // Deduct if O-level doesn't meet requirements
  if (olevelResult && olevelResult.passCount < olevelResult.required) {
    chanceNum = Math.max(5, chanceNum - 30);
    if (chance === "High" || chance === "Good") chance = "Moderate";
  }

  return { aggregate: parseFloat(agg.toFixed(2)), max_aggregate: uni.max_aggregate, meets_jamb: meetsJamb, meets_course_cut: meetsCourse, meets_aggregate: meetsAgg, needed_post_score: neededPost, course_cutoff: cd.cutoff, aggregate_cutoff: cd.agg, competition, chance, chanceColor, chanceNum, olevelResult };
}

const COMMON_SUBJECTS = [
  "English Language","Mathematics","Biology","Chemistry","Physics",
  "Economics","Government","Literature in English","Geography","Commerce",
  "Accounting","Agriculture","History","CRS","IRS","Fine Art","Music",
  "French","Technical Drawing","Food & Nutrition",
];

export default function AdmissionChecker() {
  const nav = useNavigate();
  const back = useBackNav();
  const [step, setStep] = useState(1); // 1=Scores, 2=OLevel, 3=Result
  const [jambScore, setJambScore] = useState("");
  const [postScore, setPostScore] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [waecGrades, setWaecGrades] = useState({});
  const [necoGrades, setNecoGrades] = useState({});
  const [useWaec, setUseWaec] = useState(true);
  const [useNeco, setUseNeco] = useState(false);
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [showSubjectTip, setShowSubjectTip] = useState(false);

  const uniKeys = Object.keys(UNIVERSITIES);
  const selectedU = UNIVERSITIES[university];
  const uniCourses = selectedU ? Object.keys(selectedU.courses).sort() : [];
  const courseInfo = COURSE_INFO[course];

  const setGrade = (exam, subj, grade) => {
    if (exam === "waec") setWaecGrades(g => ({ ...g, [subj]: grade }));
    else setNecoGrades(g => ({ ...g, [subj]: grade }));
  };

  const handleCheck = () => {
    if (!jambScore || !postScore || !university || !course) return alert("Fill in JAMB score, Post-UTME score, university and course.");
    const res = calc(UNIVERSITIES[university], course, parseInt(jambScore), parseInt(postScore), waecGrades, necoGrades);
    setResult({ ...res, uni: UNIVERSITIES[university], course, jambScore: parseInt(jambScore), postScore: parseInt(postScore) });
    setAllResults([]); setCompareMode(false); setStep(3);
  };

  const handleCompareAll = () => {
    if (!jambScore || !postScore || !course) return alert("Enter JAMB score, Post-UTME score, and a course.");
    const jamb = parseInt(jambScore), post = parseInt(postScore);
    const results = [];
    uniKeys.forEach(key => {
      const uni = UNIVERSITIES[key];
      if (uni.courses[course]) {
        const res = calc(uni, course, jamb, post, waecGrades, necoGrades);
        if (res) results.push({ ...res, uni, key, course });
      }
    });
    results.sort((a, b) => b.chanceNum - a.chanceNum);
    setAllResults(results); setResult(null); setCompareMode(true); setStep(3);
  };

  const subjectsToGrade = courseInfo
    ? [...new Set([...courseInfo.olevel, ...COMMON_SUBJECTS])].slice(0, 16)
    : COMMON_SUBJECTS;

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
        <button style={s.back} onClick={() => step > 1 && step < 3 ? setStep(s2 => s2 - 1) : back()}>
          {step > 1 && step < 3 ? "← Back" : "← Dashboard"}
        </button>
        <div style={s.titleRow}>
          <div>
            <h2 style={s.title}>🎓 Admission Checker</h2>
            <p style={s.sub}>Scores + O-Level = precise admission chances for {uniKeys.length} universities</p>
          </div>
        </div>

        {/* Progress steps */}
        <div style={s.steps}>
          {[["1","Scores"],["2","O-Level"],["3","Result"]].map(([n, lbl], i) => (
            <div key={n} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ ...s.stepDot, background: step >= i+1 ? "#6c63ff" : "#dfe6e9", color: step >= i+1 ? "#fff" : "#b2bec3" }}>{n}</div>
              <span style={{ fontSize:11, fontWeight:700, color: step >= i+1 ? "#6c63ff" : "#b2bec3" }}>{lbl}</span>
              {i < 2 && <div style={{ width:24, height:2, background: step > i+1 ? "#6c63ff" : "#dfe6e9", margin:"0 2px" }} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Scores ── */}
        {step === 1 && (
          <div style={s.card}>
            <div style={s.cardTitle}>📊 Your Exam Scores</div>

            <label style={s.label}>JAMB Score (out of 400)</label>
            <input style={s.input} type="number" min="0" max="400" placeholder="e.g. 280"
              value={jambScore} onChange={e => setJambScore(e.target.value)} />

            <label style={s.label}>Expected Post-UTME Score (%)</label>
            <input style={s.input} type="number" min="0" max="100" placeholder="e.g. 70"
              value={postScore} onChange={e => setPostScore(e.target.value)} />

            <label style={s.label}>Target University</label>
            <select style={s.input} value={university} onChange={e => { setUniversity(e.target.value); setCourse(""); setResult(null); }}>
              <option value="">Select university…</option>
              {uniKeys.map(k => <option key={k} value={k}>{UNIVERSITIES[k].name} ({UNIVERSITIES[k].short}) — {UNIVERSITIES[k].type}</option>)}
            </select>

            <label style={s.label}>Course / Department <span style={{ color:"#b2bec3", fontWeight:400 }}>({university ? uniCourses.length : ALL_COURSES.length} available)</span></label>
            <select style={s.input} value={course} onChange={e => { setCourse(e.target.value); setResult(null); }}>
              <option value="">Select course…</option>
              {(university ? uniCourses : ALL_COURSES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Course info panel */}
            {courseInfo && (
              <div style={s.courseInfoBox}>
                <div style={{ fontWeight:800, fontSize:13, color:"#6c63ff", marginBottom:4 }}>📋 Requirements for {course}</div>
                <div style={{ fontSize:12, color:"#636e72", marginBottom:6 }}>{courseInfo.note}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <div style={s.reqPill}>
                    <span style={{ fontWeight:700, color:"#2d3436" }}>JAMB:</span>&nbsp;{courseInfo.jamb.join(" · ")}
                  </div>
                  <div style={s.reqPill}>
                    <span style={{ fontWeight:700, color:"#2d3436" }}>O-Level credit:</span>&nbsp;{courseInfo.olevel.join(", ")}
                  </div>
                  <div style={{ ...s.reqPill, background:"#fff3e0", border:"1px solid #fdcb6e" }}>
                    <span style={{ fontWeight:700, color:"#b7791f" }}>Min grade required:</span>&nbsp;{courseInfo.minGrade}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display:"flex", gap:8, marginTop:16 }}>
              <button style={s.primaryBtn} onClick={() => { if (!jambScore || !postScore || !university || !course) return alert("Fill all fields before proceeding."); setStep(2); }}>
                Next: Add O-Level Grades →
              </button>
            </div>
            <button style={s.skipBtn} onClick={handleCheck}>Skip O-Level — check anyway</button>
          </div>
        )}

        {/* ── STEP 2: O-Level Grades ── */}
        {step === 2 && (
          <div style={s.card}>
            <div style={s.cardTitle}>📝 O-Level Grades (WAEC/NECO)</div>
            <p style={{ fontSize:12, color:"#636e72", marginBottom:12, lineHeight:1.7 }}>
              Adding your grades gives a more precise check. Required subjects for <strong>{course}</strong> are highlighted.
            </p>

            {/* Toggle WAEC / NECO */}
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <button style={{ ...s.toggleBtn, background: useWaec ? "#6c63ff" : "#f0f0f0", color: useWaec ? "#fff" : "#636e72" }} onClick={() => setUseWaec(v => !v)}>
                {useWaec ? "✓" : "+"} WAEC
              </button>
              <button style={{ ...s.toggleBtn, background: useNeco ? "#6c63ff" : "#f0f0f0", color: useNeco ? "#fff" : "#636e72" }} onClick={() => setUseNeco(v => !v)}>
                {useNeco ? "✓" : "+"} NECO
              </button>
            </div>

            {/* Grade grid */}
            <div style={s.gradeGrid}>
              {subjectsToGrade.map(subj => {
                const required = courseInfo?.olevel.includes(subj);
                return (
                  <div key={subj} style={{ ...s.gradeRow, borderColor: required ? "#6c63ff44" : "#f0f0f0", background: required ? "#f5f3ff" : "#fff" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight: required ? 800 : 600, color: required ? "#6c63ff" : "#2d3436", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {required && <span style={{ color:"#e17055", marginRight:2 }}>*</span>}{subj}
                      </div>
                    </div>
                    {useWaec && (
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:9, color:"#636e72", fontWeight:700, marginBottom:2 }}>WAEC</div>
                        <select style={s.gradeSelect} value={waecGrades[subj] || ""} onChange={e => setGrade("waec", subj, e.target.value)}>
                          <option value="">—</option>
                          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    )}
                    {useNeco && (
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:9, color:"#636e72", fontWeight:700, marginBottom:2 }}>NECO</div>
                        <select style={s.gradeSelect} value={necoGrades[subj] || ""} onChange={e => setGrade("neco", subj, e.target.value)}>
                          <option value="">—</option>
                          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize:11, color:"#e17055", marginBottom:12 }}>* Required subjects for {course}</p>

            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button style={s.primaryBtn} onClick={handleCheck}>Check My Chances →</button>
              {course && <button style={s.secondaryBtn} onClick={handleCompareAll}>📊 Compare All Universities</button>}
            </div>
          </div>
        )}

        {/* ── STEP 3: Result ── */}
        {step === 3 && result && !compareMode && (
          <div>
            {/* Result card */}
            <div style={s.resultCard}>
              <div style={s.resultHeader}>
                <div>
                  <div style={{ fontWeight:900, fontSize:18, color:"#2d3436" }}>{result.uni.name}</div>
                  <div style={{ color:"#636e72", fontSize:13, marginTop:2 }}>{result.course} · {result.uni.type} · {result.uni.location}</div>
                </div>
                <div style={{ ...s.chancePill, background: result.chanceColor }}>{result.chance}</div>
              </div>

              {/* Probability bar */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#636e72", marginBottom:4 }}>
                  <span>Admission Probability</span><span style={{ fontWeight:800 }}>{result.chanceNum}%</span>
                </div>
                <div style={s.barBg}><div style={{ ...s.barFill, width:`${result.chanceNum}%`, background: result.chanceColor }} /></div>
              </div>

              {/* Stats grid */}
              <div style={s.statsGrid}>
                <RStat label="Your JAMB" value={result.jambScore} sub="/400" ok={result.meets_course_cut} />
                <RStat label="Post-UTME" value={`${result.postScore}%`} sub="expected" ok={result.meets_aggregate} />
                <RStat label="Aggregate" value={result.aggregate} sub={`/${result.max_aggregate}`} ok={result.meets_aggregate} />
                <RStat label="Required" value={result.aggregate_cutoff} sub={`/${result.max_aggregate}`} neutral />
              </div>

              {/* Checklist */}
              <div style={s.checkList}>
                <CI ok={result.meets_jamb} text={`JAMB minimum: ${result.jambScore} ${result.meets_jamb ? "≥" : "<"} ${result.uni.jamb_cutoff} (${result.uni.short} requirement)`} />
                <CI ok={result.meets_course_cut} text={`Course cutoff: ${result.jambScore} ${result.meets_course_cut ? "≥" : "<"} ${result.course_cutoff} for ${result.course} at ${result.uni.short}`} />
                <CI ok={result.meets_aggregate} text={`Aggregate: ${result.aggregate} ${result.meets_aggregate ? "≥" : "<"} ${result.aggregate_cutoff} required aggregate`} />
                {result.olevelResult && (
                  <CI ok={result.olevelResult.passCount >= result.olevelResult.required}
                    text={`O-Level: ${result.olevelResult.passCount}/${result.olevelResult.required} required subjects have credit (C6 or better)`} />
                )}
              </div>

              {/* Competition badge */}
              <div style={{ ...s.compBox, borderColor: COMPETITION_THRESHOLDS[result.competition]?.color }}>
                <span style={{ fontWeight:800, color: COMPETITION_THRESHOLDS[result.competition]?.color }}>{result.competition} Competition</span>
                <p style={{ fontSize:13, color:"#636e72", margin:"4px 0 0", lineHeight:1.6 }}>{COMPETITION_THRESHOLDS[result.competition]?.desc}</p>
              </div>

              {/* Subject requirements */}
              {courseInfo && (
                <div style={{ background:"#f8f9fa", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
                  <div style={{ fontWeight:800, fontSize:13, color:"#2d3436", marginBottom:6 }}>📚 What you need for {result.course}</div>
                  <div style={{ fontSize:12, color:"#636e72", marginBottom:8, lineHeight:1.6 }}>{courseInfo.note}</div>
                  <div style={{ fontSize:12 }}>
                    <span style={{ fontWeight:700, color:"#2d3436" }}>JAMB subjects: </span>
                    <span style={{ color:"#636e72" }}>{courseInfo.jamb.join(", ")}</span>
                  </div>
                  <div style={{ fontSize:12, marginTop:4 }}>
                    <span style={{ fontWeight:700, color:"#2d3436" }}>O-Level credits needed: </span>
                    <span style={{ color:"#636e72" }}>{courseInfo.olevel.join(", ")} (minimum {courseInfo.minGrade})</span>
                  </div>
                </div>
              )}

              {/* Post-UTME needed */}
              {!result.meets_aggregate && result.needed_post_score <= 100 && (
                <div style={s.needBox}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#6c63ff" }}>📌 You need {result.needed_post_score}% in Post-UTME</div>
                  <p style={{ fontSize:13, color:"#636e72", margin:"4px 0 8px", lineHeight:1.6 }}>With JAMB {result.jambScore}, scoring {result.needed_post_score}% in Post-UTME will meet the aggregate cutoff of {result.aggregate_cutoff}.</p>
                  <button style={s.primaryBtn} onClick={() => nav("/exam-select?type=POST-UTME")}>Practice Post-UTME →</button>
                </div>
              )}

              {result.needed_post_score > 100 && (
                <div style={{ ...s.needBox, background:"#ffeae9", border:"2px solid #e17055" }}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#e17055" }}>⚠️ JAMB score is too low</div>
                  <p style={{ fontSize:13, color:"#636e72", margin:"4px 0 8px", lineHeight:1.6 }}>Even with 100% Post-UTME, your aggregate will not reach {result.aggregate_cutoff}. You need JAMB ≥ {result.course_cutoff} for {result.course} at {result.uni.short}.</p>
                  <button style={s.secondaryBtn} onClick={handleCompareAll}>Find Universities That Accept You →</button>
                </div>
              )}

              {result.meets_aggregate && (
                <div style={{ ...s.needBox, background:"#e8f8f5", border:"2px solid #00b894" }}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#00b894" }}>✅ You meet the score requirements!</div>
                  <p style={{ fontSize:13, color:"#636e72", margin:"4px 0 8px", lineHeight:1.6 }}>{result.competition} competition — keep practising Post-UTME to stay competitive.</p>
                  <button style={s.primaryBtn} onClick={() => nav("/exam-select?type=POST-UTME")}>Keep Practising →</button>
                </div>
              )}

              {/* Uni info strip */}
              <div style={s.uniStrip}>
                <span>📝 {result.uni.post_utme_questions || "60"} questions</span>
                <span>⏱ {result.uni.post_utme_time || "45"} mins</span>
                <span>📍 {result.uni.location}</span>
                <span>🏛 {result.uni.type}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              {course && <button style={s.secondaryBtn} onClick={handleCompareAll}>📊 Compare All Universities</button>}
              <button style={s.secondaryBtn} onClick={() => { setStep(1); setResult(null); }}>🔄 Check Another</button>
            </div>
          </div>
        )}

        {/* ── Compare Mode ── */}
        {step === 3 && compareMode && (
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>📊 {course} — All Universities</h3>
            <p style={{ color:"#636e72", fontSize:13, marginBottom:14 }}>JAMB: {jambScore} · Post-UTME: {postScore}% — sorted best to worst</p>
            {allResults.length === 0 && <p style={{ color:"#636e72", padding:20, textAlign:"center" }}>No universities found for {course}. Try a different course.</p>}
            {allResults.map((r, i) => (
              <div key={r.key} style={s.compareRow} onClick={() => { setUniversity(r.key); setCourse(course); setResult({ ...r }); setCompareMode(false); }}>
                <span style={{ fontWeight:800, width:28, color:"#636e72", fontSize:13 }}>#{i + 1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#2d3436" }}>{r.uni.name}</div>
                  <div style={{ fontSize:11, color:"#636e72", marginTop:1 }}>{r.uni.type} · {r.uni.location} · Agg: {r.aggregate}/{r.max_aggregate}</div>
                  <div style={{ height:4, background:"#f0f0f0", borderRadius:2, overflow:"hidden", marginTop:5 }}>
                    <div style={{ height:"100%", width:`${r.chanceNum}%`, background: r.chanceColor, borderRadius:2 }} />
                  </div>
                </div>
                <div style={{ ...s.chancePill, background: r.chanceColor, fontSize:11, padding:"3px 10px", flexShrink:0 }}>{r.chance}</div>
              </div>
            ))}
            <button style={{ ...s.secondaryBtn, marginTop:12 }} onClick={() => { setStep(1); setResult(null); setCompareMode(false); }}>🔄 Check Another Course</button>
          </div>
        )}
      </div>
    </div>
  );
}

function RStat({ label, value, sub, ok, neutral }) {
  const color = neutral ? "#6c63ff" : ok ? "#00b894" : "#e17055";
  return (
    <div style={{ background:"#f8f9fa", borderRadius:10, padding:"12px 8px", textAlign:"center" }}>
      <div style={{ fontSize:18, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:10, color:"#636e72" }}>{sub}</div>
      <div style={{ fontSize:11, color:"#636e72", marginTop:2 }}>{label}</div>
    </div>
  );
}
function CI({ ok, text }) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"6px 0", borderBottom:"1px solid #f0f0f0", fontSize:12 }}>
      <span style={{ color: ok ? "#00b894" : "#e17055", fontWeight:800, flexShrink:0 }}>{ok ? "✓" : "✗"}</span>
      <span style={{ color:"#2d3436", lineHeight:1.5 }}>{text}</span>
    </div>
  );
}

const s = {
  page:        { minHeight:"100vh", background:"#f8f9fa", fontFamily:"sans-serif", padding:"12px 14px", paddingBottom:80 },
  container:   { maxWidth:640, margin:"0 auto" },
  back:        { background:"none", border:"none", color:"#6c63ff", fontWeight:700, cursor:"pointer", fontSize:13, marginBottom:10, padding:0 },
  titleRow:    { marginBottom:12 },
  title:       { fontSize:22, fontWeight:900, color:"#2d3436", marginBottom:2 },
  sub:         { color:"#636e72", fontSize:12, margin:0 },
  steps:       { display:"flex", alignItems:"center", gap:4, marginBottom:16, flexWrap:"wrap" },
  stepDot:     { width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, flexShrink:0 },
  card:        { background:"#fff", borderRadius:16, padding:"18px 16px", boxShadow:"0 2px 16px rgba(0,0,0,0.07)", marginBottom:12 },
  cardTitle:   { fontSize:15, fontWeight:800, color:"#2d3436", marginBottom:14 },
  label:       { display:"block", fontSize:12, fontWeight:700, color:"#636e72", marginBottom:5, marginTop:12 },
  input:       { width:"100%", padding:"11px 12px", border:"2px solid #dfe6e9", borderRadius:10, fontSize:14, boxSizing:"border-box", color:"#2d3436", outline:"none" },
  courseInfoBox: { background:"#f5f3ff", border:"1.5px solid #6c63ff44", borderRadius:12, padding:"12px 14px", marginTop:12 },
  reqPill:     { fontSize:11, color:"#636e72", background:"#fff", border:"1px solid #dfe6e9", borderRadius:20, padding:"4px 10px", lineHeight:1.6 },
  primaryBtn:  { flex:1, minWidth:120, padding:"12px 16px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, fontWeight:800, cursor:"pointer", fontSize:14 },
  secondaryBtn:{ padding:"11px 16px", background:"#f0edff", color:"#6c63ff", border:"2px solid #6c63ff", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13 },
  skipBtn:     { display:"block", width:"100%", marginTop:8, padding:"9px 0", background:"none", border:"none", color:"#b2bec3", fontSize:12, cursor:"pointer", textAlign:"center" },
  toggleBtn:   { padding:"8px 16px", borderRadius:20, border:"none", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.15s" },
  gradeGrid:   { display:"flex", flexDirection:"column", gap:4, marginBottom:12, maxHeight:420, overflowY:"auto", paddingRight:4 },
  gradeRow:    { display:"flex", alignItems:"center", gap:8, padding:"8px 10px", border:"1px solid", borderRadius:9 },
  gradeSelect: { padding:"4px 6px", border:"1.5px solid #dfe6e9", borderRadius:7, fontSize:12, color:"#2d3436", background:"#fff", width:60 },
  resultCard:  { background:"#fff", borderRadius:16, padding:"18px 16px", boxShadow:"0 2px 16px rgba(0,0,0,0.07)", marginBottom:12 },
  resultHeader:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, flexWrap:"wrap", gap:8 },
  chancePill:  { color:"#fff", fontWeight:800, padding:"6px 14px", borderRadius:20, fontSize:13, whiteSpace:"nowrap" },
  barBg:       { height:10, background:"#f0f0f0", borderRadius:5, overflow:"hidden" },
  barFill:     { height:"100%", borderRadius:5, transition:"width 0.6s ease" },
  statsGrid:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 },
  checkList:   { marginBottom:14 },
  compBox:     { border:"2px solid", borderRadius:10, padding:"12px 14px", marginBottom:12 },
  needBox:     { background:"#f0edff", border:"2px solid #6c63ff", borderRadius:10, padding:"14px 16px", marginBottom:12 },
  uniStrip:    { display:"flex", gap:12, flexWrap:"wrap", fontSize:12, color:"#636e72", paddingTop:12, borderTop:"1px solid #f0f0f0", marginTop:12 },
  compareRow:  { display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:"1px solid #f0f0f0", cursor:"pointer" },
};
