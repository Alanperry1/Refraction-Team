import { Patient } from ".";

export interface Recommendation {
  id: number;
  patientId: number;
  recommendation: string;
  doctorNotes: string;
  doctorSignature: string;
  createdAt: string;
}

export interface SavedRecommendation {
  recommendation: string;
  doctorNotes: string;
  doctorSignature: string;
}

export interface GenerateRecommendationParams {
  patient: Patient;
  simulated?: boolean;
}

export function generateRecommendation(params: GenerateRecommendationParams): Promise<string> {
  const { patient, simulated = true } = params;
  
  // If we're using simulated mode, we'll generate a recommendation based on the patient's data
  if (simulated) {
    return simulateRecommendation(patient);
  }
  
  // In a real implementation, this would call an LLM API
  // For future Perplexity API integration
  return Promise.resolve("Recommendations will be generated via Perplexity API");
}

async function simulateRecommendation(patient: Patient): Promise<string> {
  // Simulate API call with a small delay for realism
  await new Promise(resolve => setTimeout(resolve, 1500)); 

  const rightSph = patient.rightEye.sph;
  const leftSph = patient.leftEye.sph;
  const rightCyl = patient.rightEye.cyl;
  const leftCyl = patient.leftEye.cyl;
  const rightAxis = patient.rightEye.axis;
  const leftAxis = patient.leftEye.axis;
  const rightAdd = patient.rightEye.add;
  const leftAdd = patient.leftEye.add;
  const age = patient.age;
  
  // Create a personalized recommendation based on the patient's specific prescription values
  let recommendations = [];
  
  // Lens material recommendations based on prescription strength
  if (Math.abs(rightSph) > 4 || Math.abs(leftSph) > 4) {
    recommendations.push("High-index (1.67 or 1.74) lenses are strongly recommended due to the high prescription power. These will provide thinner, lighter lenses that improve both comfort and aesthetics.");
  } else if (Math.abs(rightSph) > 2 || Math.abs(leftSph) > 2) {
    recommendations.push("Mid-index (1.59 or 1.60) lenses would be appropriate for this prescription range, offering a good balance between lens thickness and cost.");
  } else {
    recommendations.push("Standard CR-39 (1.50) lenses are suitable for this prescription, offering good optical quality at a reasonable cost.");
  }
  
  // Astigmatism considerations
  if (Math.abs(rightCyl) > 2 || Math.abs(leftCyl) > 2) {
    recommendations.push("Digital free-form lenses would provide superior visual clarity for this level of astigmatism. Consider discussing the benefits of custom-designed lenses with the patient.");
  } else if (Math.abs(rightCyl) > 0.75 || Math.abs(leftCyl) > 0.75) {
    recommendations.push("Aspheric lens design recommended to minimize peripheral distortion from the cylindrical component of the prescription.");
  }
  
  // Age-specific recommendations
  if (age < 18) {
    recommendations.push("Polycarbonate or Trivex lenses recommended for increased impact resistance, which is especially important for younger patients.");
    recommendations.push("Blue light filtering treatment should be considered given the amount of digital device usage typical for this age group.");
  } else if (age > 40 && (rightAdd > 0 || leftAdd > 0)) {
    if (age < 50) {
      recommendations.push("Progressive lenses with a wider intermediate zone would be beneficial for computer work and daily tasks requiring intermediate vision.");
    } else {
      recommendations.push("Premium progressive lenses with enhanced reading zones recommended for comfortable near vision tasks.");
    }
  }
  
  // Coating recommendations for everyone
  recommendations.push("Anti-reflective coating recommended to reduce glare and improve visual clarity, especially for night driving and digital screen use.");
  recommendations.push("UV protection treatment essential for long-term eye health.");
  
  // Follow-up recommendations
  recommendations.push("Annual follow-up examination recommended to monitor any prescription changes.");
  
  // Format the recommendations in a professional, medical tone
  return recommendations.join("\n\n");
}