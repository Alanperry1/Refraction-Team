import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditDialogProps } from "@/types";
import { useState } from "react";

export default function EditConfirmDialog({ isOpen, onClose, onConfirm, patientName }: EditDialogProps) {
  const [pin, setPin] = useState("");
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    onConfirm(pin);
    setPin("");
  };
  
  const handleCancel = () => {
    setPin("");
    onClose();
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-10" onClick={handleCancel}></div>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <i className="ri-edit-line text-xl text-yellow-600"></i>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Patient Record</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Please enter your security PIN to edit 
                      {patientName ? ` ${patientName}'s` : " this patient's"} record.
                    </p>
                    <div className="mt-4">
                      <label htmlFor="editPin" className="block text-sm font-medium text-gray-700">
                        Security PIN:
                      </label>
                      <Input 
                        id="editPin" 
                        type="password" 
                        placeholder="PIN" 
                        value={pin} 
                        onChange={(e) => setPin(e.target.value)} 
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <Button 
                className="sm:ml-3 bg-yellow-600 hover:bg-yellow-700"
                onClick={handleConfirm}
              >
                Edit Record
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="mt-3 sm:mt-0"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
