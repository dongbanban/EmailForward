import type { EmailTemplate } from "@/types/email";

/**
 * 模板服务类
 * 负责加载和管理邮件模板
 */
class TemplateService {
  /**
   * 从服务端加载默认配置路径的模板
   * @returns 模板列表
   */
  async loadDefaultTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await fetch("/api/templates/load");
      const result = await response.json();

      if (!result.success) {
        console.warn("Failed to load default templates:", result.message);
        return [];
      }

      return result.templates;
    } catch (error) {
      console.error("Failed to load default templates:", error);
      return [];
    }
  }

  /**
   * 通过 File System Access API 选择并加载模板目录
   * @returns 模板列表
   */
  async loadTemplatesFromDirectory(): Promise<EmailTemplate[]> {
    try {
      // 检查浏览器是否支持 File System Access API
      if (!("showDirectoryPicker" in window)) {
        throw new Error(
          "Your browser does not support File System Access API, please use Chrome/Edge 86+"
        );
      }

      // Let user select directory
      // @ts-ignore - File System Access API type definitions
      const directoryHandle = await window.showDirectoryPicker({
        mode: "read",
      });

      // 递归读取目录中的 HTML 文件
      const templates = await this.readDirectory(directoryHandle, "");

      return templates;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new Error("User cancelled selection");
      }
      console.error("Failed to load templates:", error);
      throw new Error(
        `Failed to load templates: ${(error as Error).message || error}`
      );
    }
  }

  /**
   * 递归读取目录
   * @param directoryHandle 目录句柄
   * @param relativePath 相对路径
   * @returns 模板列表
   */
  private async readDirectory(
    directoryHandle: any,
    relativePath: string
  ): Promise<EmailTemplate[]> {
    const templates: EmailTemplate[] = [];

    for await (const entry of directoryHandle.values()) {
      const entryPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      if (entry.kind === "file") {
        // 只处理 HTML 文件
        if (entry.name.endsWith(".html")) {
          const file = await entry.getFile();
          const content = await file.text();

          templates.push({
            fileName: entry.name,
            relativePath: entryPath,
            fullPath: entryPath,
            htmlContent: content,
          });
        }
      } else if (entry.kind === "directory") {
        // 递归读取子目录
        const subTemplates = await this.readDirectory(entry, entryPath);
        templates.push(...subTemplates);
      }
    }

    return templates;
  }
}

// 导出单例实例
export const templateService = new TemplateService();
