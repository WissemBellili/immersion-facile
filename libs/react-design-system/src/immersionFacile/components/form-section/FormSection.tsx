import React from "react";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { useStyles } from "tss-react/dsfr";
import "./FormSection.scss";

export type FormSectionProps = {
  label: string;
  expanded?: boolean;
  status?: "default" | "valid" | "invalid";
  children: React.ReactNode;
  onExpandedChange: (expanded: boolean | undefined) => void;
};

const componentName = "im-form-section";

export const FormSection = ({
  label,
  expanded,
  status = "default",
  children,
  onExpandedChange,
}: FormSectionProps) => {
  const { cx } = useStyles();
  return (
    <Accordion
      label={label}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      className={cx(componentName, `${componentName}--${status}`)}
    >
      <>{children}</>
    </Accordion>
  );
};
