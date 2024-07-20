# Accendo Test
> A small software engineering task for Accendo organization


## Context
> Scenario:
> As a HR Admin, I want to upload and update my companies organizational chart. I
> want to have the flexibility to edit them in a csv file and upload them through an API
> and then if there is any new employee, employee that are promoted or any employee
> that leave, I would like to change the org chart details without the need to upload again
> the full csv file.

File used as basic org chart [OrgChart.csv](./resources/org-chart.csv)

## Used technologies

1. NodeJS (Express) { NodeJS version: 20.15.1 }
2. Postgres { 17beta2 }
3. Docker { v27.0.3, docker-compose v1.29.2 }

## Run the solution
> Make sure you have `node`, `docker` & `docker-compose` installed locally or the place you are running this code


1. Pre-check
    ```shell
    $> docker -v
    Docker version 27.0.3, build 7d4bcd8
    ```

    ```shell
    $> docker-compose -v
    docker-compose version 1.29.2, build 5becea4c
    ```

    ```shell
    $> node -v
    v20.15.1
    ```

    The above commands  must not return `command not found`

2. Open terminal in the root directory
3. Install dependencies
    ```shell
    $> cd src
    src $> npm install
    ```
4. Execute `tests` first for database migrations (only required once for docker host)
    ```shell
    $> docker-compose run accendo-test npm test
    ```
5. Run server for safe execution
    ```shell
    $> docker-compose up -d
    ```
6. Test a sample API
    1. Using terminal:
    ```shell
    $> curl -w "\n" \
       -X GET \
       localhost:3000/
    ```
    2. Visiting web on browser
    [http://localhost:3000](http://localhost:3000/)


## References
Bootstrapping guide used [here](https://semaphoreci.com/community/tutorials/dockerizing-a-node-js-web-application)