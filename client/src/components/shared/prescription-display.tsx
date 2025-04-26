import { formatDiopter } from "@/lib/utils";
import { PatientPrescriptionDisplay } from "@/types";

export default function PrescriptionDisplay({ patient }: PatientPrescriptionDisplay) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Prescription Information</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eye</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sphere (SPH)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cylinder (CYL)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Axis</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Add</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <i className="ri-eye-line text-blue-600"></i>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">Right Eye (OD)</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDiopter(patient.rightEye.sph)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDiopter(patient.rightEye.cyl)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {patient.rightEye.axis}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDiopter(patient.rightEye.add)}
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <i className="ri-eye-line text-green-600"></i>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">Left Eye (OS)</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDiopter(patient.leftEye.sph)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDiopter(patient.leftEye.cyl)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {patient.leftEye.axis}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDiopter(patient.leftEye.add)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Pupillary Distance (PD)</h4>
        <div className={`flex items-center ${patient.pdType === "single" ? "text-primary-600" : "text-gray-400"}`}>
          <div className="flex-shrink-0 h-5 w-5">
            <i className={`${patient.pdType === "single" ? "ri-checkbox-circle-line" : "ri-checkbox-blank-circle-line"}`}></i>
          </div>
          <span className="ml-2 text-sm text-gray-700">
            Single PD: <span className="font-medium">{patient.pd} mm</span>
          </span>
        </div>
        <div className={`flex items-center mt-1 ${patient.pdType === "dual" ? "text-primary-600" : "text-gray-400"}`}>
          <div className="flex-shrink-0 h-5 w-5">
            <i className={`${patient.pdType === "dual" ? "ri-checkbox-circle-line" : "ri-checkbox-blank-circle-line"}`}></i>
          </div>
          <span className="ml-2 text-sm text-gray-700">
            Dual PD: Right <span className="font-medium">{patient.pdOd} mm</span>, 
            Left <span className="font-medium">{patient.pdOs} mm</span>
          </span>
        </div>
      </div>
    </div>
  );
}
