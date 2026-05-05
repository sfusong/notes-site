# Docker 应用流程与容器化原理：从 Java 程序到容器运行

这份文档用和 Jenkins 教学文档一样的方式讲 Docker：

> 我写了 Java 代码，Maven 打成了 jar。Docker 是如何把这个 jar 和运行环境一起打包，并让它在不同机器上用一致方式运行的？

先记一句话：

```text
Jenkins 管流程，Docker 管环境，Java 管业务。
```

Jenkins 解决的是：

```text
一串步骤按什么顺序执行，什么时候暂停，什么时候归档报告。
```

Docker 解决的是：

```text
应用在不同机器上运行时，运行环境如何保持一致。
```

---

## 1. 为什么需要 Docker

假设我们写好了一个 Java 自动化工具。

本地可以这样运行：

```bash
java -jar target/ta-automation-replica-0.1.0.jar generate-apply \
  --scenario=T0_PURCHASE_SUCCESS \
  --businessDate=20260601 \
  --sellerCode=N8Y
```

在你自己的电脑上，它可能运行得很好。

但是到了测试服务器、Jenkins 节点或者另一个同事的机器上，可能就会出现各种问题：

```text
服务器没装 Java
Java 版本不一致
Maven 版本不一致
系统环境变量没配
配置文件路径不一样
文件目录权限不一样
依赖库缺失
脚本在不同环境下表现不一致
```

这就是常见的：

```text
我本地可以跑，为什么到服务器就不行？
```

Docker 的思路是：

```text
不要只交付代码，也不要只交付 jar。
把应用运行所需的环境也一起打包。
```

也就是说，最终交付的不是：

```text
一个 jar 包
```

而是：

```text
一个 Docker image
```

这个 image 里面包含：

```text
基础操作系统层
Java 运行环境
应用 jar
启动命令
必要的目录结构
```

这样无论在谁的机器上，只要能运行 Docker，就可以用接近一致的方式启动应用。

---

## 2. Docker 的完整应用链路

以 Java 项目为例，完整链路是：

```text
Java 源代码
  ↓
Maven 打包成 jar
  ↓
Dockerfile 描述运行环境
  ↓
docker build 构建镜像 image
  ↓
docker run 启动容器 container
  ↓
容器内执行 java -jar
  ↓
应用运行
```

如果和 Jenkins 链路放在一起看，会更清楚。

Jenkins 链路：

```text
Java class
  ↓
jar
  ↓
Shell 脚本
  ↓
Jenkinsfile
  ↓
Jenkins 页面
```

Docker 链路：

```text
Java class
  ↓
jar
  ↓
Dockerfile
  ↓
image
  ↓
container
```

二者不是互相替代，而是互相配合。

```text
Jenkins 负责什么时候跑、按什么步骤跑。
Docker 负责用什么环境跑。
Java 负责具体跑什么业务逻辑。
```

---

## 3. Docker 的四个核心概念

先掌握四个词：

```text
Dockerfile
image
container
registry
```

它们之间的关系是：

```text
Dockerfile  --docker build-->  image  --docker run-->  container
                                         ↓
                                      registry
```

更口语一点：

```text
Dockerfile 是说明书。
image 是根据说明书做出来的应用运行模板。
container 是 image 真正跑起来后的实例。
registry 是存放 image 的仓库。
```

---

## 4. Dockerfile 是什么

Dockerfile 是一份“运行环境构建说明书”。

它告诉 Docker：

```text
从哪个基础环境开始
工作目录在哪里
把哪些文件复制进去
容器启动时执行什么命令
```

一个 Java CLI 工具的 Dockerfile 可以长这样：

```dockerfile
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY target/ta-automation-replica-0.1.0.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
```

逐行解释：

```text
FROM eclipse-temurin:17-jre
```

表示：

```text
这个镜像从一个已经装好 Java 17 运行环境的基础镜像开始。
```

```text
WORKDIR /app
```

表示：

```text
容器里的当前工作目录是 /app。
```

```text
COPY target/ta-automation-replica-0.1.0.jar app.jar
```

表示：

```text
把本机 target 目录里的 jar 复制到容器里，并命名为 app.jar。
```

```text
ENTRYPOINT ["java", "-jar", "app.jar"]
```

表示：

```text
容器启动时默认执行 java -jar app.jar。
```

所以 Dockerfile 并不是业务代码。

它描述的是：

```text
业务代码应该在什么环境里运行。
```

---

## 5. image 镜像是什么

image 是通过 Dockerfile 构建出来的结果。

构建命令是：

```bash
docker build -t ta-automation-replica:0.1.0 .
```

这条命令的意思是：

```text
读取当前目录下的 Dockerfile
构建一个镜像
镜像名叫 ta-automation-replica
版本标签是 0.1.0
```

镜像可以理解成：

```text
一个只读的应用运行包
```

它里面已经包含：

```text
Java 运行环境
应用 jar
启动命令
基础文件系统
```

为什么说 image 是“模板”？

因为 image 本身不是正在运行的程序。

它更像：

```text
安装包
快照
运行模板
```

真正跑起来的是 container。

---

## 6. container 容器是什么

container 是 image 运行起来后的实例。

启动容器：

```bash
docker run --rm ta-automation-replica:0.1.0
```

如果镜像的 `ENTRYPOINT` 是：

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
```

那么容器启动后，本质上会执行：

```bash
java -jar app.jar
```

如果要给 Java CLI 传参数，可以这样：

```bash
docker run --rm ta-automation-replica:0.1.0 generate-apply \
  --scenario=T0_PURCHASE_SUCCESS \
  --businessDate=20260601 \
  --sellerCode=N8Y
```

这里的参数：

```text
generate-apply --scenario=...
```

会追加到 ENTRYPOINT 后面。

所以容器内实际执行的是：

```bash
java -jar app.jar generate-apply \
  --scenario=T0_PURCHASE_SUCCESS \
  --businessDate=20260601 \
  --sellerCode=N8Y
```

也就是说，Docker 并没有改变 Java 程序的本质。

它只是把运行环境包住了。

---

## 7. 容器化原理：Docker 到底隔离了什么

要理解 Docker，需要知道它不是虚拟机。

虚拟机通常会模拟一整套完整操作系统：

```text
虚拟硬件
完整 Guest OS
应用程序
```

Docker 容器更轻：

```text
多个容器共享宿主机内核
每个容器有自己的文件系统、进程空间、网络空间等隔离视图
```

可以简化理解为：

```text
Docker 不是给每个应用装一台完整电脑。
Docker 是给每个应用一个隔离的运行房间。
```

容器里看起来有自己的：

```text
文件系统
进程列表
网络端口
环境变量
工作目录
```

但底层仍然共享宿主机的 Linux 内核。

这就是为什么 Docker 比虚拟机启动快、资源占用小。

---

## 8. 为什么容器默认数据容易丢

容器通常是临时的。

比如：

```bash
docker run --rm ta-automation-replica:0.1.0 ...
```

`--rm` 表示：

```text
容器运行结束后自动删除。
```

如果应用在容器内部生成了文件，比如：

```text
/app/data/inbound/APPLY_20260601_N8Y.txt
/app/reports/report.md
```

容器删除后，这些文件也可能随之消失。

但我们这个 TA 自动化项目恰恰很依赖文件：

```text
申请文件
确认文件
测试报告
```

所以需要 volume 挂载。

---

## 9. volume 挂载是什么

volume 挂载就是：

```text
把宿主机上的某个目录，挂到容器里的某个目录。
```

比如：

```bash
docker run --rm \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/reports:/app/reports \
  ta-automation-replica:0.1.0 generate-apply \
  --scenario=T0_PURCHASE_SUCCESS \
  --businessDate=20260601 \
  --sellerCode=N8Y
```

这里：

```text
-v $(pwd)/data:/app/data
```

意思是：

```text
把宿主机当前目录下的 data 目录
挂到容器里的 /app/data
```

```text
-v $(pwd)/reports:/app/reports
```

意思是：

```text
把宿主机当前目录下的 reports 目录
挂到容器里的 /app/reports
```

这样 Java 程序在容器里写：

```text
/app/data/inbound/APPLY_20260601_N8Y.txt
```

宿主机上也能看到：

```text
./data/inbound/APPLY_20260601_N8Y.txt
```

这对于文件类自动化项目非常重要。

因为 TA 要读取申请文件，测试人员要查看确认文件，Jenkins 要归档报告。

---

## 10. registry 镜像仓库是什么

image 构建好后，可以只在本机用。

但在团队协作或 Jenkins 环境中，通常要推到镜像仓库。

常见镜像仓库有：

```text
Docker Hub
Harbor
AWS ECR
阿里云镜像仓库
公司内部 Registry
```

推送镜像：

```bash
docker tag ta-automation-replica:0.1.0 registry.xxx.com/ta-automation-replica:0.1.0
docker push registry.xxx.com/ta-automation-replica:0.1.0
```

其他服务器可以拉取：

```bash
docker pull registry.xxx.com/ta-automation-replica:0.1.0
```

然后运行：

```bash
docker run --rm registry.xxx.com/ta-automation-replica:0.1.0 ...
```

这样就实现了：

```text
一次构建，到处运行。
```

---

## 11. Docker 如何应用到这个 TA 自动化项目

现在我们的本地运行方式是：

```bash
mvn clean package
./scripts/generate_apply.sh T0_PURCHASE_SUCCESS 20260601 N8Y
```

如果容器化，可以多一层 Dockerfile。

示例 Dockerfile：

```dockerfile
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY target/ta-automation-replica-0.1.0.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
```

构建镜像：

```bash
mvn clean package
docker build -t ta-automation-replica:0.1.0 .
```

运行生成申请文件：

```bash
docker run --rm \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/reports:/app/reports \
  ta-automation-replica:0.1.0 generate-apply \
  --scenario=T0_PURCHASE_SUCCESS \
  --businessDate=20260601 \
  --sellerCode=N8Y \
  --batchNo=BAT-T0_PURCHASE_SUCCESS-20260601-N8Y \
  --inboundDir=/app/data/inbound
```

运行确认文件校验：

```bash
docker run --rm \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/reports:/app/reports \
  ta-automation-replica:0.1.0 validate-confirm \
  --scenario=T0_PURCHASE_SUCCESS \
  --businessDate=20260601 \
  --sellerCode=N8Y \
  --batchNo=BAT-T0_PURCHASE_SUCCESS-20260601-N8Y \
  --outboundDir=/app/data/outbound \
  --reportsDir=/app/reports
```

注意：

```text
容器里路径是 /app/data
宿主机路径是 ./data
```

它们通过 volume 挂载连在一起。

---

## 12. Docker 和 Jenkins 如何配合

Jenkins 和 Docker 经常一起用。

Jenkins 负责：

```text
拉代码
跑测试
打 jar
构建镜像
推送镜像
运行容器
归档报告
```

Docker 负责：

```text
提供一致的运行环境
```

Jenkinsfile 可以写成：

```groovy
stage('Build Jar') {
    steps {
        sh 'mvn clean package'
    }
}

stage('Build Docker Image') {
    steps {
        sh 'docker build -t ta-automation-replica:${BUILD_NUMBER} .'
    }
}

stage('Generate Apply File In Container') {
    steps {
        sh '''
          docker run --rm \
            -v $PWD/data:/app/data \
            -v $PWD/reports:/app/reports \
            ta-automation-replica:${BUILD_NUMBER} generate-apply \
            --scenario=${SCENARIO} \
            --businessDate=${BUSINESS_DATE} \
            --sellerCode=${SELLER_CODE} \
            --batchNo=${BATCH_NO} \
            --inboundDir=/app/data/inbound
        '''
    }
}
```

也就是说，原来 Jenkins 调的是：

```bash
./scripts/generate_apply.sh ...
```

容器化后，Jenkins 可以调：

```bash
docker run ... ta-automation-replica:tag generate-apply ...
```

或者让 shell 脚本内部改成调用 docker。

---

## 13. Docker、Jenkins、Shell、Java 的职责边界

这几个东西容易混。

可以这样区分：

| 层 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| Java | 文件生成、确认文件解析、字段比对、报告 | 不负责调度整个流水线 |
| Shell | 包装命令，让步骤可重复执行 | 不承载复杂业务规则 |
| Jenkins | 参数化触发、stage 编排、人工 checkpoint、归档 | 不负责应用运行环境一致性 |
| Docker | 打包运行环境，启动容器 | 不决定业务结果是否正确 |
| SQL / DB | 保存测试数据、预期、实际快照、比对结果 | 不负责启动 TA 批处理 |
| TA | 读取申请文件、真实批处理、生成确认文件 | 不由我们的 Docker 容器替代 |

一句话：

```text
Jenkins 负责编排，Docker 负责环境，Shell 负责步骤入口，Java 负责业务逻辑。
```

---

## 14. Docker 不会改变业务边界

把 TA 自动化工具容器化后，项目边界不会改变。

我们仍然负责：

```text
生成申请文件
解析确认文件
expected vs actual 对账
输出报告
```

TA 仍然负责：

```text
读取申请文件
执行真实批处理
生成确认文件
```

测试人员仍然负责：

```text
在 TA 图形化界面启动批处理
确认 TA 生成确认文件
```

Docker 只是让我们的自动化工具更容易在不同环境运行。

它不会让我们突然拥有 TA 服务。

这一点在面试里也要讲清楚。

---

## 15. Docker 的常见命令怎么理解

构建镜像：

```bash
docker build -t ta-automation-replica:0.1.0 .
```

查看镜像：

```bash
docker images
```

运行容器：

```bash
docker run --rm ta-automation-replica:0.1.0
```

带参数运行：

```bash
docker run --rm ta-automation-replica:0.1.0 generate-apply --scenario=T0_PURCHASE_SUCCESS
```

挂载目录运行：

```bash
docker run --rm -v $(pwd)/data:/app/data ta-automation-replica:0.1.0 ...
```

查看正在运行的容器：

```bash
docker ps
```

查看所有容器：

```bash
docker ps -a
```

查看日志：

```bash
docker logs <container-id>
```

停止容器：

```bash
docker stop <container-id>
```

给镜像打 tag：

```bash
docker tag ta-automation-replica:0.1.0 registry.xxx.com/ta-automation-replica:0.1.0
```

推送镜像：

```bash
docker push registry.xxx.com/ta-automation-replica:0.1.0
```

拉取镜像：

```bash
docker pull registry.xxx.com/ta-automation-replica:0.1.0
```

---

## 16. 容器化后 expected vs actual 对账如何表现

容器化不会改变对账逻辑。

原来是：

```text
Shell -> java -jar -> validate-confirm -> exit code -> Jenkins stage
```

容器化后是：

```text
Jenkins -> docker run -> 容器内 java -jar -> validate-confirm -> exit code -> docker run exit code -> Jenkins stage
```

如果 Java 代码返回：

```text
exit code 0
```

那么 `docker run` 也会成功，Jenkins stage 绿色。

如果 Java 代码返回：

```text
exit code 2
```

那么 `docker run` 也会失败，Jenkins stage 红色。

链路是：

```text
字段级对账失败
  ↓
Java 返回非 0
  ↓
容器进程退出码非 0
  ↓
docker run 返回非 0
  ↓
Jenkins stage 失败
```

所以 Docker 不会削弱业务校验。

它只是多包了一层运行环境。

---

## 17. 面试时如何讲 Docker

可以这样讲：

“Docker 的作用是把应用和运行环境一起打包，避免不同机器上 Java 版本、依赖和配置不一致导致的问题。以 Java 应用为例，我们先用 Maven 把项目打成 jar，然后写 Dockerfile 指定基础镜像、工作目录、jar 包位置和启动命令。通过 docker build 构建 image，再通过 docker run 启动 container。容器启动后，本质上仍然是执行 java -jar，只是 Java 运行环境和应用包都已经在镜像里了。如果应用要生成文件或报告，就通过 volume 把宿主机目录挂到容器里，保证文件能持久化和被 Jenkins 归档。在 Jenkins 流水线里，Docker 通常作为一个 stage 或运行方式，由 Jenkins 编排 docker build、docker run 或 docker push。”

---

## 18. 常见追问

### Dockerfile 和 image 是什么关系？

Dockerfile 是说明书。

image 是根据 Dockerfile 构建出来的结果。

### image 和 container 是什么关系？

image 是模板。

container 是 image 运行起来后的实例。

### Docker 和虚拟机有什么区别？

虚拟机会启动完整操作系统，比较重。

Docker 容器共享宿主机内核，只隔离应用运行视图，更轻、更快。

### 为什么要用 volume？

因为容器默认是临时的。

如果不挂载目录，容器里生成的申请文件、确认文件、报告可能随着容器删除而丢失。

### Docker 和 Jenkins 谁负责什么？

Jenkins 负责编排流程。

Docker 负责提供一致运行环境。

### Docker 会替代 Shell 吗？

不一定。

Shell 仍然可以保留，用来包装 docker run 命令。

### Docker 会替代 TA 吗？

不会。

Docker 只能容器化我们的自动化辅助工具，不能替代真实 TA 批处理系统。

---

## 19. 最短总结

Docker 的应用流程可以压缩成：

```text
Maven 打 jar
Dockerfile 描述环境
docker build 生成 image
docker run 启动 container
容器里执行 java -jar
volume 挂载 data/reports
Jenkins 编排 docker build/run/push
```

最短的一句话：

```text
Docker 不是业务逻辑，它是运行环境的封装；Jenkins 不是运行环境，它是流程编排；Java 才是具体业务逻辑。
```

