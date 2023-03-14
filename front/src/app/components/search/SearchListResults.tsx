import React, { useEffect, useState } from "react";
import { ContactMethod, domElementIds, SearchImmersionResultDto } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { SuccessFeedback } from "src/app/components/SuccessFeedback";
import {
  ContactEstablishmentModal,
  useContactEstablishmentModal,
} from "./ContactEstablishmentModal";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { SearchResult } from "./SearchResult";
import { Select } from "react-design-system";
import { fr } from "@codegouvfr/react-dsfr";

const getFeedBackMessage = (contactMethod?: ContactMethod) => {
  switch (contactMethod) {
    case "EMAIL":
      return "L'entreprise a été contactée avec succès.";
    case "PHONE":
    case "IN_PERSON":
      return "Un email vient de vous être envoyé.";
    default:
      return null;
  }
};

type ResultsPerPageOptions = (typeof resultsPerPageOptions)[number];

const resultsPerPageOptions = [6, 12, 24, 48] as const;
const defaultResultsPerPage: ResultsPerPageOptions = 12;
const initialPage = 0;

const isResultPerPageOption = (value: number): value is ResultsPerPageOptions =>
  resultsPerPageOptions.includes(value as ResultsPerPageOptions);

export const SearchListResults = () => {
  const searchResults = useAppSelector(searchSelectors.searchResults);
  // prettier-ignore
  const [successfulValidationMessage, setSuccessfulValidatedMessage] = useState<string | null>(null);
  const [successFullyValidated, setSuccessfullyValidated] = useState(false);
  const { modalState, dispatch } = useContactEstablishmentModal();
  const [displayedResults, setDisplayedResults] =
    useState<SearchImmersionResultDto[]>(searchResults);
  const [resultsPerPage, setResultsPerPage] = useState<ResultsPerPageOptions>(
    defaultResultsPerPage,
  );
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  const getSearchResultsForPage = (currentPage: number) => {
    const start = currentPage * resultsPerPage;
    const end = start + resultsPerPage;
    return searchResults.slice(start, end);
  };

  useEffect(() => {
    setDisplayedResults(getSearchResultsForPage(currentPage));
  }, [currentPage, resultsPerPage]);

  return (
    <>
      <div className={fr.cx("fr-container")}>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {displayedResults.map((searchResult) => (
            <SearchResult
              key={searchResult.siret + "-" + searchResult.rome} // Should be unique !
              establishment={searchResult}
              onButtonClick={() =>
                dispatch({
                  type: "CLICKED_OPEN",
                  payload: {
                    immersionOfferRome: searchResult.rome,
                    immersionOfferSiret: searchResult.siret,
                    siret: searchResult.siret,
                    offer: {
                      romeCode: searchResult.rome,
                      romeLabel: searchResult.romeLabel,
                    },
                    contactMethod: searchResult.contactMode,
                    searchResultData: searchResult,
                  },
                })
              }
              disableButton={modalState.isValidating}
            />
          ))}
        </div>
      </div>
      <div className={fr.cx("fr-container", "fr-mb-10w")}>
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--middle", "fr-mt-4w")}
        >
          <div className={fr.cx("fr-col-10", "fr-grid-row")}>
            <Pagination
              showFirstLast
              count={totalPages}
              defaultPage={currentPage + 1}
              getPageLinkProps={(pageNumber) => ({
                title: `Résultats de recherche, page : ${pageNumber}`,
                onClick: (event) => {
                  event.preventDefault();
                  setCurrentPage(pageNumber - 1);
                },
                href: "#", // TODO : PR vers react-dsfr pour gérer pagination full front
                key: `pagination-link-${pageNumber}`,
              })}
              className={fr.cx("fr-mt-1w")}
            />
          </div>
          <div
            className={fr.cx("fr-col-2", "fr-grid-row", "fr-grid-row--right")}
          >
            <Select
              label="Nombre de résultats par page"
              onChange={(event) => {
                const value = parseInt(event.currentTarget.value);
                if (isResultPerPageOption(value)) {
                  setResultsPerPage(value);
                }
              }}
              value={resultsPerPage}
              options={[
                ...resultsPerPageOptions.map((number) => ({
                  label: `${number} résultats / page`,
                  value: number,
                })),
              ]}
              id={domElementIds.search.resultPerPageDropdown}
              hideLabel
            />
          </div>
        </div>
      </div>
      <ContactEstablishmentModal
        modalState={modalState}
        dispatch={dispatch}
        onSuccess={() => {
          setSuccessfulValidatedMessage(
            getFeedBackMessage(modalState.contactMethod),
          );
          setSuccessfullyValidated(true);
        }}
      />
      {successfulValidationMessage && (
        <SuccessFeedback
          open={successFullyValidated}
          handleClose={() => {
            setSuccessfulValidatedMessage(null);
            setSuccessfullyValidated(false);
          }}
        >
          {successfulValidationMessage}
        </SuccessFeedback>
      )}
    </>
  );
};
