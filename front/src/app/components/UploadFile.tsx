import { File } from "react-design-system/immersionFacile";
import * as React from "react";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { technicalGateway } from "src/app/config/dependencies";

interface UploadFileProps {
  label: string;
  hint?: string;
  maxSize_Mo: number;
  setFileUrl: (fileUrl: AbsoluteUrl) => void;
}

export const UploadFile = ({
  maxSize_Mo,
  setFileUrl,
  label,
  hint,
}: UploadFileProps) => {
  const [error, setError] = React.useState<string>();
  return (
    <File
      onChange={async (e) => {
        const file = e.target.files[0];

        if (file.size > 1_000_000 * maxSize_Mo) {
          setError(`Le fichier ne peut pas faire plus de ${maxSize_Mo} Mo`);
          return;
        } else {
          setError(undefined);
        }
        if (!file) return;

        const fileUrl = await technicalGateway.uploadFile(file);
        setFileUrl(fileUrl);
      }}
      label={label}
      hint={hint}
      errorMessage={error}
    />
  );
};
