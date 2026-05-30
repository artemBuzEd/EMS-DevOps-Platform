using System.ComponentModel;
using System.Data;
using System.Reflection;
using System.Text;
using EMS.DAL.ADO.NET.Repositories.Contracts;
using System.Data.SqlClient;
using Dapper;
using Npgsql;

namespace EMS.DAL.ADO.NET.Repositories;

public abstract class GenericRepository<T> :IGenericRepository<T> where T : class
{
        protected IDbConnection _sqlConnection;

        protected IDbTransaction _dbTransaction;

        private readonly string _tableName;

        protected GenericRepository(IDbConnection sqlConnection, IDbTransaction dbTransaction, string tableName)
        {
            _sqlConnection = sqlConnection;
            _dbTransaction = dbTransaction;
            _tableName = tableName;
        }


        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _sqlConnection.QueryAsync<T>($"SELECT * FROM {_tableName}", 
                transaction: _dbTransaction);
        }

        public async Task<T> GetByIdAsync(int id)
        {
            var result = await _sqlConnection.QuerySingleOrDefaultAsync<T>($"SELECT * FROM {_tableName} WHERE Id=@Id", 
                param: new { Id = id }, 
                transaction: _dbTransaction);
            
            return result;
        }

        public async Task DeleteAsync(int id)
        {
            await _sqlConnection.ExecuteAsync($"DELETE FROM {_tableName} WHERE Id=@Id", 
                param: new { Id = id }, 
                transaction: _dbTransaction);
        }

        public async Task<int> AddAsync(T t)
        {
            var insertQuery = GenerateInsertQuery();
            var newId = await _sqlConnection.ExecuteScalarAsync<int>(insertQuery,
                param: t,
                transaction: _dbTransaction);
            return newId;
        }

        public async Task<int> AddRangeAsync(IEnumerable<T> list)
        {
            var inserted = 0;
            var query = GenerateInsertQuery();
            inserted += await _sqlConnection.ExecuteAsync(query, 
                param: list);
            return inserted;
        }


        public async Task ReplaceAsync(T t)
        {
            var updateQuery = GenerateUpdateQuery();
            await _sqlConnection.ExecuteAsync(updateQuery, 
                param: t, 
                transaction: _dbTransaction);
        }
        
        // работа со свойствами модели
        private IEnumerable<PropertyInfo> GetProperties => typeof(T).GetProperties();
        private static List<string> GenerateListOfProperties(IEnumerable<PropertyInfo> listOfProperties)
        {
            return (from prop in listOfProperties
                    let attributes = prop.GetCustomAttributes(typeof(DescriptionAttribute), false)
                    where attributes.Length <= 0 || (attributes[0] as DescriptionAttribute)?.Description != "ignore"
                    select prop.Name).ToList();
        }

        // генерация Update выражения
        private string GenerateUpdateQuery()
        {
            var updateQuery = new StringBuilder($"UPDATE {_tableName} SET ");
            var properties = GenerateListOfProperties(GetProperties);
            properties.ForEach(property =>
            {
                if (!property.Equals("Id"))
                {
                    updateQuery.Append($"{property}=@{property},");
                }
            });
            updateQuery.Remove(updateQuery.Length - 1, 1); //убираем последнию запятую
            updateQuery.Append(" WHERE Id=@Id");
            return updateQuery.ToString();
        }

        // генерация Isert выражения
        protected string GenerateInsertQuery()
        {
            var insertQuery = new StringBuilder($"INSERT INTO {_tableName} ");
            insertQuery.Append("(");
            var properties = GenerateListOfProperties(GetProperties);
            //при условии что РК - автоинкремент
            properties.Remove("id");
            //
            properties.ForEach(prop => { insertQuery.Append($"{prop},"); });
            insertQuery
                .Remove(insertQuery.Length - 1, 1)
                .Append(") VALUES (");

            properties.ForEach(prop => { insertQuery.Append($"@{prop},"); });
            insertQuery
                .Remove(insertQuery.Length - 1, 1)
                .Append(")");
//          insertQuery.Append("; SELECT SCOPE_IDENTITY()");
            insertQuery.Append(" RETURNING id;");
            return insertQuery.ToString();
        }
}