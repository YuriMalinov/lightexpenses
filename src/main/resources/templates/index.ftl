<html>
<head>
    <script src="/bower-libs/jquery/dist/jquery.min.js"></script>
    <script src="/bower-libs/angularjs/angular.min.js"></script>
    <script src="/bower-libs/bootstrap/dist/js/bootstrap.min.js"></script>
    <script src="/bower-libs/requirejs/require.js"></script>
    <link rel="stylesheet" href="/bower-libs/bootstrap/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="/bower-libs/font-awesome/css/font-awesome.min.css">
    <link rel="stylesheet" href="/css/main.css">
    <link href='https://fonts.googleapis.com/css?family=Roboto&subset=latin,cyrillic' rel='stylesheet' type='text/css'>

    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Мои расходы</title>
</head>
<body>
<div class="container" ng-controller="LightExpensesController">
    <h2 class="page-header">Мои расходы</h2>

    <form action="/connect/facebook" id="facebookConnect" method="POST">
        <a onclick="$('#facebookConnect').submit()"><i class="fa fa-facebook"/> Facebook</a>
    </form>


    <form>
        <div class="form-group">
            <div class="input-group">
                <input type="number" class="form-control col-md-4" placeholder="Сумма" required ng-model="c.currentAmount" focus-me="c.focusAmount">

                <span class="input-group-btn">
                    <select class="btn btn-info category-select"
                            ng-options="category.id as category.name for category in c.categories"
                            ng-model="c.selectedCategoryId">
                    </select>
                </span>
            </div>
        </div>
        <div class="form-group">
            <input type="text" placeholder="Описание, если нужно" class="form-control" ng-model="c.currentDescription">
        </div>
        <div class="form-group">
            <input type="submit" class="btn btn-primary" value="Добавить" ng-click="c.addExpense()">
        </div>
    </form>

    <h3>История расходов</h3>
    <table class="table">
        <tr ng-repeat="expense in c.displayExpenses">
            <td class="expense-time">{{ expense.date | date:'dd.MM HH:mm' }}</td>
            <td>
                {{ c.categoriesById[expense.categoryId].name }}
                <div class="expense-description" ng-if="expense.description" ng-bind="expense.description"></div>
            </td>
            <td class="expense-amount">
                {{ expense.amount|number }}
                <i class="fa fa-check" ng-class="{saved: category.saved, offline: !category.saved}"></i>
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <a href="#" class="btn btn-xs btn-info" ng-show="c.displayExpensesNumber < c.possibleExpensesCount" ng-click="c.increaseDisplayExpenses()">Показать ещё</a>
                <a href="#" class="btn btn-xs btn-info" ng-show="c.displayExpensesNumber > 3" ng-click="c.resetDisplayExpenses()">Свернуть</a>
            </td>
        </tr>
    </table>

    <h3>Статистика</h3>
    <table class="table">
        <tr ng-repeat="stat in c.statistics">
            <td>{{ c.categoriesById[stat.categoryId].name }}</td>
            <td>{{ stat.amount | number }}</td>
            <td>{{ stat.percent | number:0 }}%</td>
        </tr>
    </table>

    <pre>{{ c | json }}</pre>
</div>


<script type="text/javascript">
    require(['js/lightexpenses'], function (lightexpenses) {
        window.LightExpenses = lightexpenses.LightExpenses;
        angular.bootstrap(document, ['LightExpenses']);
    })
</script>

</body>
</html>