import { AxiosInstance } from "axios";
import { ExcelExportGateway } from "src/core-logic/ports/ExcelExportGateway";

import { BackOfficeJwt, ExportDataDto, exportRoute } from "shared";

export class HttpExcelExportGateway implements ExcelExportGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public async exportData(
    adminToken: BackOfficeJwt,
    exportDataDto: ExportDataDto,
  ) {
    const response = await this.httpClient.post(
      `/admin/${exportRoute}`,
      exportDataDto,
      {
        headers: { authorization: adminToken },
        responseType: "arraybuffer",
      },
    );
    const nameForParams = `${exportDataDto.fileName} ${
      exportDataDto.exportableParams.keyToGroupBy
        ? " par " + exportDataDto.exportableParams.keyToGroupBy
        : ""
    }`;

    downloadData(response.data, nameForParams);
  }
}

const downloadData = (dataToDownload: Buffer, filename: string) => {
  const blob = new Blob([dataToDownload], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.zip`);
  document.body.appendChild(link);
  link.click(); // this will download file.zip
  link.remove();
};
