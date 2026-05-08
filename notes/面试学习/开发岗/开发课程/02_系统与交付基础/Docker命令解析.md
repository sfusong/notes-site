# 配置Orange过程中的docker命令

```bash
docker run --rm guacamole/guacamole /opt/guacamole/bin/initdb.sh --mysql > initdb.sql
```

- 执行docker run命令带`--rm`命令选项，等价于在容器退出后，执行`docker rm -v`，即删除容器，同时删除数据卷。
- 进入到guacamole容器中，执行initdb.sh，参数为--mysql 生成initdb.sql
- 生成数据库文件：guacamole需要手动生成sql的导入文件，然后用mysql导入数据
- --rm参数在docker执行完毕后会清空运行时产生的数据，mysql数据重定向到当前目录的initdb.sql



```bash
#启动mysql/mysql-server镜像，生成名为example-mysql的容器,设置一个一次性的随机密码。
docker run --name example-mysql -e MYSQL_RANDOM_ROOT_PASSWORD=yes -e MYSQL_ONETIME_PASSWORD=yes -d mysql/mysql-server 

#使用logs命令查看此密码
docker logs example-mysql

#复制guacamole生成的sql文件到mysql容器中
docker cp initdb.sql example-mysql:/guac_db.sql
```

`docker cp` 命令 把initdb.sql移动到example-mysql容器中并重命名为guac_db.sql

```bash
#进入example-mysql容器
docker exec -it example-mysql bash

mysql -u root -p
#输入密码


```

然后输入以下SQL语句

```
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password'; 

CREATE DATABASE guacamole_db; 

CREATE USER 'guacamole_user'@'%' IDENTIFIED BY 'password'; 

GRANT SELECT,INSERT,UPDATE,DELETE ON guacamole_db.* TO 'guacamole_user'@'%'; 

FLUSH PRIVILEGES;
```

