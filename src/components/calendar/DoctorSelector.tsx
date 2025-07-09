import { Label } from "@/components/ui/label";
import { Stethoscope } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { UserProfile } from "@/lib/firebase/rbac";
interface DoctorSelectorProps {
  doctors: UserProfile[];
  selectedDoctor: string;
  onDoctorChange: (doctorId: string) => void;
}

export const DoctorSelector: React.FC<DoctorSelectorProps> = ({
  doctors,
  selectedDoctor,
  onDoctorChange,
}) => {
  const selectedDoctorInfo = doctors.find((d) => d.uid === selectedDoctor);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="doctorSelect">Seleccionar Doctor</Label>
            <select
              id="doctorSelect"
              value={selectedDoctor}
              onChange={(e) => onDoctorChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
            >
              <option value="">Seleccione un doctor...</option>
              {doctors.map((doctor) => (
                <option key={doctor.uid} value={doctor.uid}>
                  {doctor.displayName || doctor.email}
                </option>
              ))}
            </select>
          </div>

          {selectedDoctorInfo && (
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">{selectedDoctorInfo.displayName}</p>
                <p className="text-sm text-gray-600">
                  {selectedDoctorInfo.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
