import { PatientFormData } from "@/types";
import { calculateAge } from "./utils";

/**
 * Attempts to extract prescription data from a pdf file
 */
export async function parsePdfFile(file: File): Promise<Partial<PatientFormData>> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let extractedText = '';
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map((item: any) => item.str).join(' ');
        }
        
        const patientData = extractDataFromText(extractedText);
        resolve(patientData);
      } catch (error) {
        reject(new Error('Failed to parse PDF file'));
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * Attempts to extract prescription data from a docx file
 */
export async function parseDocxFile(file: File): Promise<Partial<PatientFormData>> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const docx = await (window as any).docx.load(arrayBuffer);
        
        // Extract text from the document
        const extractedText = docx.getFullText();
        
        const patientData = extractDataFromText(extractedText);
        resolve(patientData);
      } catch (error) {
        reject(new Error('Failed to parse DOCX file'));
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * Attempts to extract prescription data from a txt file
 */
export async function parseTxtFile(file: File): Promise<Partial<PatientFormData>> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const patientData = extractDataFromText(text);
        resolve(patientData);
      } catch (error) {
        reject(new Error('Failed to parse text file'));
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    fileReader.readAsText(file);
  });
}

/**
 * Extract patient data from text content using regex patterns
 */
function extractDataFromText(text: string): Partial<PatientFormData> {
  const patientData: Partial<PatientFormData> = {
    rightEye: {
      sph: 0,
      cyl: 0,
      axis: 0,
      add: 0
    },
    leftEye: {
      sph: 0,
      cyl: 0,
      axis: 0,
      add: 0
    },
    pdType: "single"
  };
  
  // Extract name
  const nameMatch = text.match(/Name:\s*([^\n\r]+)/i) || 
                   text.match(/Patient:\s*([^\n\r]+)/i) ||
                   text.match(/Patient Name:\s*([^\n\r]+)/i);
  if (nameMatch) patientData.name = nameMatch[1].trim();
  
  // Extract phone
  const phoneMatch = text.match(/Phone:\s*([^\n\r]+)/i) || 
                     text.match(/Tel:\s*([^\n\r]+)/i) ||
                     text.match(/Telephone:\s*([^\n\r]+)/i);
  if (phoneMatch) patientData.phone = phoneMatch[1].trim();
  
  // Extract email
  const emailMatch = text.match(/Email:\s*([^\n\r]+)/i) || 
                     text.match(/E-mail:\s*([^\n\r]+)/i);
  if (emailMatch) patientData.email = emailMatch[1].trim();
  
  // Extract location
  const locationMatch = text.match(/Location:\s*([^\n\r]+)/i) || 
                        text.match(/Address:\s*([^\n\r]+)/i) ||
                        text.match(/City:\s*([^\n\r]+)/i);
  if (locationMatch) patientData.location = locationMatch[1].trim();
  
  // Extract DOB
  const dobMatch = text.match(/DOB:\s*([^\n\r]+)/i) || 
                   text.match(/Date of Birth:\s*([^\n\r]+)/i) ||
                   text.match(/Birth Date:\s*([^\n\r]+)/i);
  if (dobMatch) {
    const dobString = dobMatch[1].trim();
    // Try to convert to YYYY-MM-DD format for input type date
    const dobDate = new Date(dobString);
    if (!isNaN(dobDate.getTime())) {
      patientData.dob = dobDate.toISOString().split('T')[0];
    }
  }
  
  // Extract exam date
  const examMatch = text.match(/Exam Date:\s*([^\n\r]+)/i) || 
                    text.match(/Examination Date:\s*([^\n\r]+)/i) ||
                    text.match(/Date of Examination:\s*([^\n\r]+)/i);
  if (examMatch) {
    const examString = examMatch[1].trim();
    // Try to convert to YYYY-MM-DD format for input type date
    const examDate = new Date(examString);
    if (!isNaN(examDate.getTime())) {
      patientData.examDate = examDate.toISOString().split('T')[0];
    } else {
      patientData.examDate = new Date().toISOString().split('T')[0]; // Default to today
    }
  } else {
    patientData.examDate = new Date().toISOString().split('T')[0]; // Default to today
  }
  
  // Extract right eye data
  const sph1Match = text.match(/SPH1:\s*([-+]?\d+\.?\d*)/i) || text.match(/OD SPH:\s*([-+]?\d+\.?\d*)/i);
  if (sph1Match) patientData.rightEye!.sph = parseFloat(sph1Match[1]);
  
  const cyl1Match = text.match(/CYL1:\s*([-+]?\d+\.?\d*)/i) || text.match(/OD CYL:\s*([-+]?\d+\.?\d*)/i);
  if (cyl1Match) patientData.rightEye!.cyl = parseFloat(cyl1Match[1]);
  
  const axis1Match = text.match(/AXIS1:\s*(\d+)/i) || text.match(/OD AXIS:\s*(\d+)/i);
  if (axis1Match) patientData.rightEye!.axis = parseInt(axis1Match[1]);
  
  const add1Match = text.match(/ADD1:\s*([-+]?\d+\.?\d*)/i) || text.match(/OD ADD:\s*([-+]?\d+\.?\d*)/i);
  if (add1Match) patientData.rightEye!.add = parseFloat(add1Match[1]);
  
  // Extract left eye data
  const sph2Match = text.match(/SPH2:\s*([-+]?\d+\.?\d*)/i) || text.match(/OS SPH:\s*([-+]?\d+\.?\d*)/i);
  if (sph2Match) patientData.leftEye!.sph = parseFloat(sph2Match[1]);
  
  const cyl2Match = text.match(/CYL2:\s*([-+]?\d+\.?\d*)/i) || text.match(/OS CYL:\s*([-+]?\d+\.?\d*)/i);
  if (cyl2Match) patientData.leftEye!.cyl = parseFloat(cyl2Match[1]);
  
  const axis2Match = text.match(/AXIS2:\s*(\d+)/i) || text.match(/OS AXIS:\s*(\d+)/i);
  if (axis2Match) patientData.leftEye!.axis = parseInt(axis2Match[1]);
  
  const add2Match = text.match(/ADD2:\s*([-+]?\d+\.?\d*)/i) || text.match(/OS ADD:\s*([-+]?\d+\.?\d*)/i);
  if (add2Match) patientData.leftEye!.add = parseFloat(add2Match[1]);
  
  // Extract PD information
  const pdDualMatch = text.match(/Pupillary Distance:\s*.*Dual/i);
  if (pdDualMatch) {
    patientData.pdType = "dual";
    
    const pdOdMatch = text.match(/PD OD:\s*(\d+\.?\d*)/i) || text.match(/Right PD:\s*(\d+\.?\d*)/i);
    if (pdOdMatch) patientData.pdOd = parseFloat(pdOdMatch[1]);
    
    const pdOsMatch = text.match(/PD OS:\s*(\d+\.?\d*)/i) || text.match(/Left PD:\s*(\d+\.?\d*)/i);
    if (pdOsMatch) patientData.pdOs = parseFloat(pdOsMatch[1]);
  } else {
    const pdMatch = text.match(/PD:\s*(\d+\.?\d*)/i) || text.match(/Pupillary Distance:\s*(\d+\.?\d*)/i);
    if (pdMatch) {
      patientData.pdType = "single";
      patientData.pd = parseFloat(pdMatch[1]);
    }
  }
  
  return patientData;
}

/**
 * Parse patient file based on file type
 */
export async function parsePatientFile(file: File): Promise<Partial<PatientFormData>> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  try {
    switch (fileExtension) {
      case 'pdf':
        return await parsePdfFile(file);
      case 'docx':
        return await parseDocxFile(file);
      case 'txt':
        return await parseTxtFile(file);
      default:
        throw new Error('Unsupported file format. Please upload a PDF, DOCX, or TXT file.');
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error('Failed to parse patient file. Please check the file format and try again.');
  }
}
