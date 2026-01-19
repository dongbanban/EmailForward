/**
 * @file: /Users/i104/EmailForward/server/vite-email-plugin.js
 * @author: dongyang
 */
import nodemailer from "nodemailer";
import { readFileSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 读取邮件配置
 */
const loadEmailConfig = () => {
  try {
    const configPath = resolve(__dirname, "../src/config/email.config.ts");
    const configContent = readFileSync(configPath, "utf-8");

    // 简单解析 TypeScript 配置文件（提取配置对象）
    const smtpHostMatch = configContent.match(/host:\s*"([^"]+)"/);
    const smtpPortMatch = configContent.match(/port:\s*(\d+)/);
    const smtpSecureMatch = configContent.match(/secure:\s*(true|false)/);
    const smtpUserMatch = configContent.match(/user:\s*"([^"]+)"/);
    const smtpPassMatch = configContent.match(/pass:\s*"([^"]+)"/);
    const fromNameMatch = configContent.match(
      /from:\s*{[^}]*name:\s*"([^"]+)"/
    );
    const fromEmailMatch = configContent.match(
      /from:\s*{[^}]*email:\s*"([^"]+)"/
    );
    const connectionTimeoutMatch = configContent.match(
      /connectionTimeout:\s*(\d+)/
    );
    const greetingTimeoutMatch = configContent.match(
      /greetingTimeout:\s*(\d+)/
    );
    const socketTimeoutMatch = configContent.match(/socketTimeout:\s*(\d+)/);
    const defaultTemplatePathMatch = configContent.match(
      /defaultTemplatePath:\s*"([^"]+)"/
    );

    return {
      smtp: {
        host: smtpHostMatch ? smtpHostMatch[1] : "smtp.gmail.com",
        port: smtpPortMatch ? parseInt(smtpPortMatch[1]) : 465,
        secure: smtpSecureMatch ? smtpSecureMatch[1] === "true" : true,
        auth: {
          user: smtpUserMatch ? smtpUserMatch[1] : "",
          pass: smtpPassMatch ? smtpPassMatch[1] : "",
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: connectionTimeoutMatch
          ? parseInt(connectionTimeoutMatch[1])
          : 30000,
        greetingTimeout: greetingTimeoutMatch
          ? parseInt(greetingTimeoutMatch[1])
          : 30000,
        socketTimeout: socketTimeoutMatch
          ? parseInt(socketTimeoutMatch[1])
          : 30000,
      },
      from: {
        name: fromNameMatch ? fromNameMatch[1] : "Email Forward",
        email: fromEmailMatch ? fromEmailMatch[1] : "",
      },
      defaultTemplatePath: defaultTemplatePathMatch
        ? defaultTemplatePathMatch[1]
        : "",
    };
  } catch (error) {
    console.error("Read config failed:", error);
    throw error;
  }
};

/**
 * 递归读取目录下的所有 HTML 模板文件
 */
const readTemplatesFromPath = (dirPath, basePath = dirPath) => {
  const templates = [];

  try {
    const items = readdirSync(dirPath);

    for (const item of items) {
      // 跳过隐藏文件和 node_modules
      if (item.startsWith(".") || item === "node_modules") {
        continue;
      }

      const fullPath = join(dirPath, item);

      try {
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // 递归读取子目录
          const subTemplates = readTemplatesFromPath(fullPath, basePath);
          templates.push(...subTemplates);
        } else if (stat.isFile() && item.endsWith(".html")) {
          // 读取 HTML 文件
          const content = readFileSync(fullPath, "utf-8");
          const relativePath = fullPath
            .replace(basePath, "")
            .replace(/^\//, "");

          templates.push({
            fileName: item,
            relativePath: relativePath,
            fullPath: fullPath,
            htmlContent: content,
          });
        }
      } catch (itemError) {
        console.error(`  ⚠️  Unable to read ${fullPath}:`, itemError.message);
      }
    }
  } catch (error) {
    console.error(`❌ Reading directory ${dirPath} failed:`, error);
  }

  return templates;
};

/**
 * 创建邮件发送 Vite 插件
 */
export function createEmailPlugin() {
  return {
    name: "vite-email-plugin",
    configureServer(server) {
      // 加载邮件配置
      const emailConfig = loadEmailConfig();

      // 创建 SMTP 传输器
      const transporter = nodemailer.createTransport(emailConfig.smtp);

      // 验证 SMTP 连接
      transporter.verify((error, success) => {
        if (error) {
          console.error("❌ SMTP connection verification failed:", error);
        } else {
          console.log("✅ SMTP server connection successful");
        }
      });

      // 发送邮件接口
      server.middlewares.use("/api/send-email", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const { to, subject, html } = JSON.parse(body);

            if (!to || !subject || !html) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  success: false,
                  message: "Missing required parameters: to, subject, html",
                })
              );
              return;
            }

            const info = await transporter.sendMail({
              from: {
                name: emailConfig.from.name,
                address: emailConfig.from.email,
              },
              to: to,
              subject: subject,
              html: html,
              replyTo: {
                name: emailConfig.from.name,
                address: emailConfig.from.email,
              },
            });

            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: true,
                message: "Email sending successfully",
                messageId: info.messageId,
              })
            );
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: false,
                message: "Email sending failed",
                error: error.message,
              })
            );
          }
        });
      });

      // 健康检查接口
      server.middlewares.use("/api/health", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ status: "ok" }));
      });

      // 加载模板文件接口
      server.middlewares.use("/api/templates/load", (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const templatePath = emailConfig.defaultTemplatePath;

          if (!templatePath) {
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: false,
                message: "No template path configured",
                templates: [],
              })
            );
            return;
          }

          console.log(`📂 Loading templates: ${templatePath}`);
          const templates = readTemplatesFromPath(templatePath);
          console.log(
            `✅ Successfully loaded ${templates.length} template files`
          );

          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              success: true,
              message: `Successfully loaded ${templates.length} templates`,
              templates: templates,
            })
          );
        } catch (error) {
          console.error("❌ Loading templates failed:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              success: false,
              message: "Loading templates failed",
              error: error.message,
            })
          );
        }
      });
    },
  };
}
