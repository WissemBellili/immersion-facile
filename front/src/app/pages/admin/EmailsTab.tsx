import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Accordion, DsfrTitle } from "react-design-system/immersionFacile";
import { EmailSentDto } from "src/../../shared/email";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import { TextCell } from "src/uiComponents/admin/TextCell";
import "./Admin.css";

export const EmailsTab = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(adminSlice.actions.lastSentEmailsRequested());
  });
  const latestEmails = useAppSelector(adminSelectors.sentEmails);

  return (
    <div>
      <DsfrTitle level={5} text="Derniers emails envoyés" />
      <ul className="fr-accordions-group">
        {latestEmails.map((email, index) => (
          <li key={index}>
            <Email email={email} />
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
};

const Email = ({ email }: { email: EmailSentDto }) => {
  const sentAtDate = new Date(email.sentAt);
  return (
    <Accordion
      title={`${email.error ? "❌" : "✅"} ${
        email.template.type
      } envoyé le ${sentAtDate.toLocaleDateString(
        "fr",
      )} à ${sentAtDate.toLocaleTimeString("fr")}`}
    >
      <TextCell title="Type" contents={email.template.type} />
      <TextCell
        title="Destinataires"
        contents={email.template.recipients.join(", ")}
      />
      <TextCell title="CC" contents={email.template.cc.join(", ")} />
      <TextCell
        title="Paramètres"
        contents={
          <ul className="text-xs">
            {Object.entries(email.template.params).map((param) => (
              <li>
                {" "}
                <span className="font-normal">{param[0]} :</span>{" "}
                <span
                  style={{ width: "500px" }}
                  className="font-thin inline-block break-words"
                >
                  {JSON.stringify(param[1], undefined, 2)}
                </span>
              </li>
            ))}
          </ul>
        }
      />
      {email?.error && (
        <TextCell title="Message d'erreur" contents={email.error} />
      )}
    </Accordion>
  );
};
