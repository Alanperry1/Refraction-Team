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
 * 
 * Example of expected format:
 * ```
 * Patient: John Doe
 * Phone: (555) 123-4567
 * Email: john@example.com
 * Location: New York, NY
 * DOB: 1985-05-15
 * Exam Date: 2025-04-25
 * 
 * --- Right Eye ---
 * SPH: -2.25
 * CYL: -0.75
 * AXIS: 180
 * ADD: +1.50
 * 
 * --- Left Eye ---
 * SPH: -2.00
 * CYL: -0.50
 * AXIS: 175
 * ADD: +1.50
 * 
 * PD: 64
 * ```
 */
export async function parseTxtFile(file: File): Promise<Partial<PatientFormData>> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        
        // First try to parse as a structured format with clear sections
        let patientData = parseStructuredTextFormat(text);
        
        // If structured parsing didn't yield much data, fall back to the general extraction
        const dataKeysCount = Object.keys(patientData).filter(key => 
          key !== 'rightEye' && key !== 'leftEye' && key !== 'pdType' && 
          patientData[key as keyof typeof patientData] !== undefined).length;
          
        if (dataKeysCount < 3) {
          patientData = extractDataFromText(text);
        }
        
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
 * Parse a text file that follows a structured format with clear sections
 */
function parseStructuredTextFormat(text: string): Partial<PatientFormData> {
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
  
  // Extract basic patient information
  const lines = text.split('\n').map(line => line.trim());
  
  let currentSection = 'patient'; // Possible values: patient, right_eye, left_eye
  let patientNameFromHeader = "";
  
  // Check for the specific format with PATIENT PRESCRIPTION header and RIGHT/LEFT EYE sections
  const prescriptionHeaderIndex = lines.findIndex(line => 
    line.toUpperCase().includes('PATIENT PRESCRIPTION'));
  
  const rightEyeHeaderIndex = lines.findIndex(line => 
    line.toUpperCase().includes('RIGHT EYE') || line.toUpperCase().includes('OD'));
  
  const leftEyeHeaderIndex = lines.findIndex(line => 
    line.toUpperCase().includes('LEFT EYE') || line.toUpperCase().includes('OS'));
  
  // Check if we're dealing with the specific format
  const isSpecificFormat = prescriptionHeaderIndex !== -1 && 
                          rightEyeHeaderIndex !== -1 && 
                          leftEyeHeaderIndex !== -1;
  
  if (isSpecificFormat) {
    // This is the specific format from sample_prescription.txt
    // Extract right eye data
    for (let i = rightEyeHeaderIndex + 1; i < leftEyeHeaderIndex; i++) {
      if (!lines[i]) continue;
      
      // Extract SPH1, CYL1, AXIS1, ADD1
      const sph1Match = lines[i].match(/SPH1:\s*([-+]?\d+\.?\d*)/i);
      if (sph1Match) {
        patientData.rightEye!.sph = parseFloat(sph1Match[1]);
        continue;
      }
      
      const cyl1Match = lines[i].match(/CYL1:\s*([-+]?\d+\.?\d*)/i);
      if (cyl1Match) {
        patientData.rightEye!.cyl = parseFloat(cyl1Match[1]);
        continue;
      }
      
      const axis1Match = lines[i].match(/AXIS1:\s*(\d+)/i);
      if (axis1Match) {
        patientData.rightEye!.axis = parseInt(axis1Match[1]);
        continue;
      }
      
      const add1Match = lines[i].match(/ADD1:\s*([-+]?\d+\.?\d*)/i);
      if (add1Match) {
        patientData.rightEye!.add = parseFloat(add1Match[1]);
        continue;
      }
      
      // Check for OD PD
      const pdMatch = lines[i].match(/PD:\s*([\d.]+)mm/i);
      if (pdMatch) {
        patientData.pdType = 'dual';
        patientData.pdOd = parseFloat(pdMatch[1]);
      }
    }
    
    // Extract left eye data
    const pupillaryDistanceIndex = lines.findIndex(line => 
      line.toUpperCase().includes('PUPILLARY DISTANCE'));
      
    const leftEyeEndIndex = pupillaryDistanceIndex !== -1 ? 
                           pupillaryDistanceIndex : lines.length;
    
    for (let i = leftEyeHeaderIndex + 1; i < leftEyeEndIndex; i++) {
      if (!lines[i]) continue;
      
      // Extract SPH2, CYL2, AXIS2, ADD2
      const sph2Match = lines[i].match(/SPH2:\s*([-+]?\d+\.?\d*)/i);
      if (sph2Match) {
        patientData.leftEye!.sph = parseFloat(sph2Match[1]);
        continue;
      }
      
      const cyl2Match = lines[i].match(/CYL2:\s*([-+]?\d+\.?\d*)/i);
      if (cyl2Match) {
        patientData.leftEye!.cyl = parseFloat(cyl2Match[1]);
        continue;
      }
      
      const axis2Match = lines[i].match(/AXIS2:\s*(\d+)/i);
      if (axis2Match) {
        patientData.leftEye!.axis = parseInt(axis2Match[1]);
        continue;
      }
      
      const add2Match = lines[i].match(/ADD2:\s*([-+]?\d+\.?\d*)/i);
      if (add2Match) {
        patientData.leftEye!.add = parseFloat(add2Match[1]);
        continue;
      }
      
      // Check for OS PD
      const pdMatch = lines[i].match(/PD:\s*([\d.]+)mm/i);
      if (pdMatch) {
        patientData.pdType = 'dual';
        patientData.pdOs = parseFloat(pdMatch[1]);
      }
    }
    
    // Extract total PD
    if (pupillaryDistanceIndex !== -1) {
      const pdLine = lines[pupillaryDistanceIndex];
      const pdMatch = pdLine.match(/PUPILLARY DISTANCE:\s*([\d.]+)mm/i);
      
      if (pdMatch) {
        // If we already have dual PD values, keep them. Otherwise set as single PD
        if (patientData.pdType !== 'dual') {
          patientData.pdType = 'single';
          patientData.pd = parseFloat(pdMatch[1]);
        }
        
        // Check if it's explicitly marked as dual
        if (pdLine.toLowerCase().includes('dual')) {
          patientData.pdType = 'dual';
          
          // If we don't have individual values, calculate them
          if (!patientData.pdOd || !patientData.pdOs) {
            const totalPd = parseFloat(pdMatch[1]);
            patientData.pdOd = Math.round(totalPd / 2 * 10) / 10;
            patientData.pdOs = Math.round(totalPd / 2 * 10) / 10;
          }
        }
      }
    }
    
    // Set default name if none provided
    if (!patientData.name) {
      patientData.name = "Patient from Prescription";
    }
    
    // Set default examination date to today
    if (!patientData.examDate) {
      patientData.examDate = new Date().toISOString().split('T')[0];
    }
    
    return patientData;
  }
  
  // If not the specific format, process with the original section-based approach
  for (const line of lines) {
    // Skip empty lines
    if (!line) continue;
    
    // Detect section changes
    if (line.match(/---\s*right\s*eye\s*---/i) || line.match(/right\s*eye\s*\(od\)/i)) {
      currentSection = 'right_eye';
      continue;
    } else if (line.match(/---\s*left\s*eye\s*---/i) || line.match(/left\s*eye\s*\(os\)/i)) {
      currentSection = 'left_eye';
      continue;
    } else if (line.match(/---\s*patient\s*---/i)) {
      currentSection = 'patient';
      continue;
    }
    
    // Process based on current section
    if (currentSection === 'patient') {
      const [key, value] = line.split(':').map(part => part.trim());
      if (!key || !value) continue;
      
      switch (key.toLowerCase()) {
        case 'patient':
        case 'name':
        case 'patient name':
          patientData.name = value;
          break;
        case 'phone':
        case 'tel':
        case 'telephone':
          patientData.phone = value;
          break;
        case 'email':
        case 'e-mail':
          patientData.email = value;
          break;
        case 'location':
        case 'address':
        case 'city':
          patientData.location = value;
          break;
        case 'dob':
        case 'date of birth':
        case 'birth date':
          try {
            const dobDate = new Date(value);
            if (!isNaN(dobDate.getTime())) {
              patientData.dob = dobDate.toISOString().split('T')[0];
            }
          } catch (e) {
            // If date parsing fails, just store the raw value
            patientData.dob = value;
          }
          break;
        case 'exam date':
        case 'examination date':
        case 'date of examination':
          try {
            const examDate = new Date(value);
            if (!isNaN(examDate.getTime())) {
              patientData.examDate = examDate.toISOString().split('T')[0];
            } else {
              patientData.examDate = new Date().toISOString().split('T')[0];
            }
          } catch (e) {
            patientData.examDate = new Date().toISOString().split('T')[0];
          }
          break;
        case 'pd':
        case 'pupillary distance':
          if (value.toLowerCase().includes('dual')) {
            patientData.pdType = 'dual';
          } else {
            const pdMatch = value.match(/(\d+\.?\d*)/);
            if (pdMatch) {
              patientData.pdType = 'single';
              patientData.pd = parseFloat(pdMatch[1]);
            }
          }
          break;
        case 'pd od':
        case 'right pd':
          patientData.pdType = 'dual';
          patientData.pdOd = parseFloat(value);
          break;
        case 'pd os':
        case 'left pd':
          patientData.pdType = 'dual';
          patientData.pdOs = parseFloat(value);
          break;
      }
    } else if (currentSection === 'right_eye') {
      // Try to match both formats: SPH: value and SPH1: value
      const sphMatch = line.match(/SPH1?:\s*([-+]?\d+\.?\d*)/i);
      if (sphMatch) {
        patientData.rightEye!.sph = parseFloat(sphMatch[1]);
        continue;
      }
      
      const cylMatch = line.match(/CYL1?:\s*([-+]?\d+\.?\d*)/i);
      if (cylMatch) {
        patientData.rightEye!.cyl = parseFloat(cylMatch[1]);
        continue;
      }
      
      const axisMatch = line.match(/AXIS1?:\s*(\d+)/i);
      if (axisMatch) {
        patientData.rightEye!.axis = parseInt(axisMatch[1]);
        continue;
      }
      
      const addMatch = line.match(/ADD1?:\s*([-+]?\d+\.?\d*)/i);
      if (addMatch) {
        patientData.rightEye!.add = parseFloat(addMatch[1]);
        continue;
      }
    } else if (currentSection === 'left_eye') {
      // Try to match both formats: SPH: value and SPH2: value
      const sphMatch = line.match(/SPH2?:\s*([-+]?\d+\.?\d*)/i);
      if (sphMatch) {
        patientData.leftEye!.sph = parseFloat(sphMatch[1]);
        continue;
      }
      
      const cylMatch = line.match(/CYL2?:\s*([-+]?\d+\.?\d*)/i);
      if (cylMatch) {
        patientData.leftEye!.cyl = parseFloat(cylMatch[1]);
        continue;
      }
      
      const axisMatch = line.match(/AXIS2?:\s*(\d+)/i);
      if (axisMatch) {
        patientData.leftEye!.axis = parseInt(axisMatch[1]);
        continue;
      }
      
      const addMatch = line.match(/ADD2?:\s*([-+]?\d+\.?\d*)/i);
      if (addMatch) {
        patientData.leftEye!.add = parseFloat(addMatch[1]);
        continue;
      }
    }
  }
  
  return patientData;
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
