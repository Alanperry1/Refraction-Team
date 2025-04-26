import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteDialogProps } from "@/types";
import { useState } from "react";

export default function DeleteConfirmDialog({ isOpen, onClose, onConfirm, patientName }: DeleteDialogProps) {
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
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <i className="ri-error-warning-line text-xl text-red-600"></i>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Patient Record</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {patientName 
                        ? `Are you sure you want to delete ${patientName}'s record?` 
                        : "Are you sure you want to delete this patient record?"} 
                      This action cannot be undone.
                    </p>
                    <div className="mt-4">
                      <label htmlFor="deletePin" className="block text-sm font-medium text-gray-700">
                        Enter Security PIN to confirm:
                      </label>
                      <Input 
                        id="deletePin" 
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
                variant="destructive" 
                onClick={handleConfirm}
                className="sm:ml-3"
              >
                Delete
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
