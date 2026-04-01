# JAR 和 WAR 是什么

这份笔记回答 3 个问题：

1. `jar` 是什么
2. `war` 是什么
3. 它们的区别是什么

---

## 1. 先一句话记住

- `jar`：Java 应用打包产物
- `war`：Java Web 应用打包产物

如果你只想先抓住最核心区别，就记住：

- `jar` 更像“一个可运行的 Java 程序包”
- `war` 更像“一个给 Web 容器部署的网站/服务包”

---

## 2. JAR 是什么

`JAR` 的全称是：

- `Java ARchive`

本质上它就是：

- 一种 Java 的压缩打包格式

它通常用来打包：

- Java 类文件
- 配置文件
- 依赖资源
- 程序入口信息

你可以把它理解成：

`“把一个 Java 程序装进一个包里”`

### 常见用途

- 普通 Java 工具程序
- 后端服务
- Spring Boot 应用
- 依赖库

### 最典型的运行方式

```bash
java -jar xxx.jar
```

这说明：

- 这个包通常自己就能跑起来

---

## 3. WAR 是什么

`WAR` 的全称是：

- `Web Application Archive`

本质上它也是一种打包格式，
但它专门给：

- Java Web 应用

使用。

你可以把它理解成：

`“把一个 Web 应用装进一个包里”`

里面通常会有：

- Java 类
- 配置文件
- Web 资源
- `WEB-INF` 目录
- 依赖库

---

## 4. WAR 一般怎么运行

`war` 通常不是直接 `java -jar` 跑的。

它更常见的方式是：

- 部署到 Tomcat、Jetty 这类 Web 容器里

比如：

- 把 `xxx.war` 放进 Tomcat
- Tomcat 启动后加载这个应用

所以你可以这样理解：

- `jar` 往往自己就能跑
- `war` 往往要放到 Web 容器里跑

---

## 5. 它们最核心的区别

## 5.1 使用场景不同

- `jar`：更通用，普通 Java 程序和很多后端服务都能用
- `war`：主要用于 Web 应用部署

## 5.2 运行方式不同

- `jar`：通常直接 `java -jar`
- `war`：通常交给 Tomcat 这类容器部署

## 5.3 结构重点不同

- `jar`：更偏 Java 程序本身
- `war`：更偏 Web 应用结构，通常包含 `WEB-INF`

---

## 6. Spring Boot 里为什么现在更多看到 JAR

以前很多 Java Web 项目喜欢打成 `war`，
因为它们依赖外部 Tomcat。

但现在很多 Spring Boot 项目喜欢打成 `jar`，
因为：

- Spring Boot 可以把内嵌 Tomcat/Jetty 一起打进去
- 最后直接 `java -jar` 就能跑

这会带来几个好处：

- 部署更简单
- 环境更统一
- 运维更方便

所以现在很多微服务、后端服务都更常见 `jar`

---

## 7. 结合你面试最可能遇到的说法

如果面试官问：

“jar 和 war 有什么区别？”

你可以这样答：

“jar 和 war 本质上都是 Java 的打包产物。jar 更通用，通常用于普通 Java 程序或后端服务，很多情况下可以直接通过 `java -jar` 运行；war 则主要用于 Web 应用，通常会部署到 Tomcat 这类 Web 容器里运行。现在很多 Spring Boot 项目之所以更常见 jar，是因为它可以把内嵌容器一起打进去，部署更简单。”

---

## 8. 再给你一个更口语的版本

“你可以把 jar 理解成一个 Java 程序包，把 war 理解成一个 Web 应用包。jar 往往自己就能跑，war 往往需要放到 Tomcat 这种容器里跑。”

---

## 9. 你现在只要记住这三句话

1. `jar` 是 Java 程序包
2. `war` 是 Java Web 应用包
3. 现在很多 Spring Boot 服务更常见 `jar`，因为它能直接运行，部署更方便

