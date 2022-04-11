import { createInMemoryUow } from "../../../adapters/primary/config";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { RomeRepository } from "../../../domain/rome/ports/RomeRepository";
import { InMemoryRomeRepository } from "../../../adapters/secondary/InMemoryRomeRepository";
import { AppellationSearch } from "../../../domain/rome/useCases/AppellationSearch";
import { AppellationMatchDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";

describe("AppellationSearch", () => {
  let romeRepo: RomeRepository;

  beforeEach(() => {
    romeRepo = new InMemoryRomeRepository();
  });

  const createUseCase = () => {
    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      romeRepo,
    });
    return new AppellationSearch(uowPerformer);
  };

  it("returns the list of found matches with ranges", async () => {
    const response = await createUseCase().execute("lapins");
    const expected: AppellationMatchDto[] = [
      {
        appellation: {
          appellationCode: "14704",
          appellationLabel: "Éleveur / Éleveuse de lapins angoras",
          romeCode: "A1409",
          romeLabel: "Élevage",
        },
        matchRanges: [{ startIndexInclusive: 22, endIndexExclusive: 28 }],
      },
    ];
    expect(response).toEqual(expected);
  });

  it("issues no queries for short search texts", async () => {
    const mockSearchMetierFn = jest.fn();
    const mockSearchAppellationFn = jest.fn();
    const mockAppellationToCodeMetier = jest.fn();
    romeRepo = {
      searchRome: mockSearchMetierFn,
      searchAppellation: mockSearchAppellationFn,
      appellationToCodeMetier: mockAppellationToCodeMetier,
    };

    const response = await createUseCase().execute("lap");
    expect(mockSearchMetierFn.mock.calls).toHaveLength(0);
    expect(mockSearchAppellationFn.mock.calls).toHaveLength(0);
    expect(response).toEqual([]);
  });

  it("returns empty list when no match is found", async () => {
    expect(await createUseCase().execute("unknown_search_term")).toEqual([]);
  });
});
