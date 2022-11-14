# NODE CACHING MYSQL CONNECTOR WITH REDIS

 NODE CACHING MYSQL CONNECTOR WITH REDIS with a Along with easily managing your mysql connections along with the output of queries cached through redis you will be able to hold
## Features

- Create your environment variables as specified in the document
- Then import the function you need and start using it right away as in the examples

## User guide

##### getCacheQuery review the usage proposal
## -------
```sh
  getCacheQuery("sql", parameterArray,"cacheName")
    .then((data) => {
        return data;
    }).catch(err => {
        throw err;
    });
```
For examples

```sh
 getCacheQuery("select * from users where companyId=?",[companyId],"userlist-"+companyId)
    .then((data) => {
        return data;
    }).catch(err => {
        throw err;
    });
```



##### getCacheQueryPagination review the usage proposal
## -------
The default number of Elements on the Page is "30"

```sh
  getCacheQueryPagination("sql", parameterArray,"cacheName",currentPage,numberOfElementsIn thePage)
    .then((data) => {
        return data;
    }).catch(err => {
        throw err;
    });
```
For examples

```sh
 getCacheQueryPagination("select * from users where companyId=?",[companyId],"userlist-"+companyId+"-page-"+page,page,30)
    .then((data) => {
        return data;
    }).catch(err => {
        throw err;
    });
```

##### QuaryCache  review the usageproposal
## -------

```sh
  QuaryCache("sql", parameterArray,"cache key to reset")
    .then((data) => {
        return data;
    }).catch(err => {
        throw err;
    });
```
For examples

```sh
 QuaryCache("insert into users set fullname=? ,email=?,password=?,companyId=?",[fullname,email,password,companyId],"userlist-"+companyId)
    .then((data) => {
        return data;
    }).catch(err => {
        throw err;
    });
```


##  Environment Variables Examples
sample environment variable file content  (.env file)
## --------- 
```sh

## db veriables
DB_HOST="localhost"
DB_USERNAME="root"
DB_PASSWORD=""
DB_NAME=""
DB_PORT=""

## redis veriables
REDIS_SERVER="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

## Development


## License

MIT
   [git-repo-url] : <https://github.com/hayatialikeles/NODE-CACHING-MYSQL-CONNECTOR-WITH-REDIS.git>
